import { In, Repository } from "typeorm";
import { compact, flatMap, uniq } from "lodash";
import { add } from "date-fns";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import AppDataSource from "../ormconfig";

import Privacy from "../enum-privacy";
import Template from "../entity/template";

const S3_BUCKET = process.env.IMMERSIVE_INTERACTIVE_ASSETS_BUCKET;

export const wherePrivacy = (
  entity,
  { orgId, userId = null, sharedWithUser = false }
) => (query) =>
  query
    .createQueryBuilder(entity)
    .where(
      `${entity}.privacy = :public`,
      { public: Privacy.PUBLIC }
    )
    .orWhere(
      (qb) =>
        qb
          .where(`${entity}.privacy = :org`, { org: Privacy.ORGANISATION })
          .andWhere(`organisation.id = :orgId`, { orgId })
    )
    .andWhere((qb) => {
      if (userId) {
        qb.orWhere(
          (qb) =>
            qb
              .where(`${entity}.privacy = :user`, { user: Privacy.PERSONAL })
              .andWhere("sub.sub = :userId", { userId })
        );
      }
      if (sharedWithUser) {
        qb.orWhere("shares.shared_to = :userId", { userId });
      }
      return qb;
    });

export const andWhereMeta = (
  entity,
  { orgId = null, userId = null, editable_by_own_org = false } = {},
  { by, category, experienceType, sector, tag, attribute, languages }
) => (query) => {
  let updatedQuery = query.createQueryBuilder(entity);

  // By
  if (by === "immersive") {
    updatedQuery = updatedQuery.andWhere(`${entity}.organisation.id = :immersiveId`, {
      immersiveId: process.env.IMMERSIVE_ACCOUNT_ID,
    });
  } else if (by === "organisation") {
    updatedQuery = updatedQuery.andWhere(`${entity}.organisation.id = :orgId`, { orgId });
  } else if (by === "user") {
    console.log("by user ", userId);
    updatedQuery = updatedQuery.andWhere(`${entity}.sub.sub = :userId`, { userId });
  }

  if (editable_by_own_org) {
    updatedQuery = updatedQuery
      .andWhere(`${entity}.editable_by_own_org = true`)
      .andWhere(`${entity}.organisation.id = :orgId`, { orgId })
      .andWhere("sub.sub != :userId", { userId });
  }

  // Meta
  if (experienceType) {
    updatedQuery = updatedQuery.andWhere(`${entity}.experienceType = :experienceType`, {
      experienceType,
    });
  }

  if (category) {
    updatedQuery = updatedQuery.andWhere(`${entity}.category = :category`, {
      category,
    });
  }

  if (sector) {
    updatedQuery = updatedQuery.andWhere(`sectors.id = :sector`, {
      sector,
    });
  }

  if (languages) {
    const languagesArray = Array.isArray(languages) ? languages : [languages];
    updatedQuery = updatedQuery.andWhere(
      (qb) => {
        languagesArray.forEach((language, index) => {
          if (index === 0) {
            qb.where(`${entity}.languages LIKE :language${index}`, {
              [`language${index}`]: `%${language}%`,
            });
          } else {
            qb.orWhere(`${entity}.languages LIKE :language${index}`, {
              [`language${index}`]: `%${language}%`,
            });
          }
        });
        return qb;
      }
    );
  }

  const tags = tag ? tag.split(",") : [];
  if (tags.length) {
    updatedQuery = updatedQuery.andWhere(
      (qb) => {
        const standardTags = tags.filter((x) => x !== "NULL");

        if (standardTags.length) {
          qb.where("tags.id IN (:...tags)", {
            tags: standardTags,
          });
        }

        if (tags.includes("NULL")) {
          qb.orWhere("tags.id IS NULL");
        }
        return qb;
      }
    );
  }

  const attributes = attribute ? attribute.split(",") : [];
  if (attributes.length) {
    updatedQuery = updatedQuery.andWhere(
      (qb) => {
        const standardAttributes = attributes.filter((x) => x !== "NULL");

        if (standardAttributes.length) {
          qb.where("attributes.id IN (:...attributes)", {
            attributes: standardAttributes,
          });
        }
        return qb;
      }
    );
  }

  return updatedQuery;
};

export const addSortUser = (entity, { column, order, deep }) => (query) => {
  let updatedQuery = addSort(entity, { column, order, deep })(query);
  if (column === "likes") {
    updatedQuery = updatedQuery.addGroupBy("user.sub");
  }
  return updatedQuery;
};

export const addSort = (entity, { column, order, deep = false }) => (query) => {
  let updatedQuery = query.createQueryBuilder(entity);

  if (column === "created_at" || column === "updated_at") {
    updatedQuery = updatedQuery.orderBy(`${entity}.${column}`, order);
  } else if (column === "name") {
    updatedQuery = updatedQuery.orderBy(`${entity}.name`, order);
  } else if (column === "likes") {
    updatedQuery = updatedQuery
      .addSelect("COUNT(likes.id)", "likescount")
      .leftJoin(`${entity}.likes`, "likes")
      .orderBy({ likescount: order });
  } else if (column === "attributes") {
    updatedQuery = updatedQuery
      .addSelect("COUNT(attributes.id)", "attributescount")
      .orderBy({ attributescount: order });
  }

  if (column === "attributes" || column === "likes") {
    updatedQuery = updatedQuery
      .groupBy(`${entity}.id`)
      .addGroupBy("category.id")
      .addGroupBy("experienceType.id")
      .addGroupBy("tags.id")
      .addGroupBy("sectors.id")
      .addGroupBy("organisation.id")
      .addGroupBy("media.id")
      .addGroupBy("sub.sub")
      .addGroupBy("sub_media.id")
      .addGroupBy("attributes.id");

    if (entity === "experience") {
      updatedQuery = updatedQuery.addGroupBy("layout.id");
    } else if (entity === "collection") {
      updatedQuery = updatedQuery
        .addGroupBy("collectionExperiences.id")
        .addGroupBy("category.id")
        .addGroupBy("experienceType.id")
        .addGroupBy("tags.id")
        .addGroupBy("experience.id")
        .addGroupBy("experience_sub.sub");

      if (deep) {
        updatedQuery = updatedQuery
          .addGroupBy("experienceCategory.id")
          .addGroupBy("experienceExperienceType.id")
          .addGroupBy("experienceTags.id")
          .addGroupBy("experienceLayout.id")
          .addGroupBy("experienceAttributes.id")
          .addGroupBy("experience_sub_media.id")
          .addGroupBy("experienceSectors.id");
      }
    }
    updatedQuery = updatedQuery.addOrderBy(`${entity}.created_at`, "DESC");
  }

  return updatedQuery;
};

export const addPagination = ({ offset, limit }) => (query) => {
  let updatedQuery = query.createQueryBuilder();
  if (offset !== undefined) {
    updatedQuery = updatedQuery.skip(offset);
  }
  if (limit !== undefined) {
    updatedQuery = updatedQuery.take(limit);
  }
  return updatedQuery;
};

export const addToMany = async (Entity, relationName, id, values) =>
  Promise.all(
    values.map((value) =>
      AppDataSource.getRepository(Entity)
        .createQueryBuilder()
        .relation(relationName)
        .of(id)
        .add(value)
    )
  );

export const removeFromMany = async (Entity, relationName, id, values) =>
  Promise.all(
    values.map((value) =>
      AppDataSource.getRepository(Entity)
        .createQueryBuilder()
        .relation(relationName)
        .of(id)
        .remove(value)
    )
  );

export const getTemplatesInExperiences = async (experiences) => {
  const templateIds = uniq(
    compact(
      flatMap(experiences, (experience) => {
        const surfaceConfig = (experience.json && experience.json.surfaceConfig) || [];
        return surfaceConfig.map((config) => config?.template?.id || null);
      })
    )
  );

  const templates = await AppDataSource.getRepository(Template)
    .createQueryBuilder("template")
    .leftJoinAndSelect("template.file", "file")
    .leftJoinAndSelect("template.templateFile", "templateFile")
    .leftJoinAndSelect("templateFile.file", "templateFileFile")
    .where("template.id IN (:...templateIds)", { templateIds })
    .getMany();

  return templates;
};

export const replaceTemplatesInSurfaceConfig = (experiences, templates) => {
  const updatedExperiences = experiences.map((experience) => {
    const surfaceConfig = (experience.json && experience.json.surfaceConfig) || [];
    const updatedConfig = surfaceConfig
      .filter((config) => config?.template)
      .map((config) => {
        const updatedTemplate = templates.find(
          (t) => t.id === config.template.id
        );
        return {
          ...config,
          template: updatedTemplate || config.template,
        };
      });
    return {
      ...experience,
      json: {
        ...experience.json,
        surfaceConfig: updatedConfig,
      },
    };
  });

  return updatedExperiences;
};

const s3 = new S3Client({
  region: "ap-south-1",
});

export const openBufferFromS3 = async (s3File) => {
  let inputFileBuffer;

  try {
    const command = new GetObjectCommand({
      Bucket: s3File.Bucket,
      Key: s3File.Key,
    });
    const { Body } = await s3.send(command);
    inputFileBuffer = await Body.transformToByteArray();
  } catch (err) {
    console.error(err);
    let message = "Error opening file";
    if (err.code === "NoSuchKey") {
      message = "File does not exist";
    }
    throw new Error(message);
  }
  return inputFileBuffer;
};