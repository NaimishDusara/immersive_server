import { pickBy, identity } from "lodash/fp";
import { Request, Response } from "express";
import AppDataSource from "../ormconfig";
import { strict as assert } from "assert";

import {
    adminUpdateUser,
    adminRemoveMfa,
    adminEnableUser,
    adminResetUsersPassword,
} from "../cognito";
import User from "../entity/user";

/**
 * curl localhost:8081/me
 **/
export async function get(request: Request, response: Response) {
    try {
        const repository = AppDataSource.getRepository(User);

        const item = await repository.findOne({
            relations: ["media"],
            where: { sub: request.body.sub },
        });

        response.status(200).send(item);
    } catch (err) {
        if (err instanceof Error) {
            response.status(400).send({ message: err.message });
        } else {
            response.status(400).send({ message: 'Unknown error', error: err });
        }
    }
}

/**
 * curl -X POST \
 * 		-H 'Content-Type: application/json' \
 * 		localhost:8081/me  \
 * 		-d '
 * 			{
 * 				"given_name":"New Name",
 * 				"family_name":"New Name"
 * 				"media":"99fbebf1-6daf-4ff6-aa72-7aaa8bf71d72"
 * 			}
 * 		'
 **/
export async function update(request: Request, response: Response) {
    try {
        const {
            first_name: given_name,
            last_name: family_name,
            media,
            preferences,
        } = request.body;

        assert(
            (!family_name && !given_name) || (family_name && given_name),
            "neither or both `first_name` and `given_name` must be present"
        );

        if (family_name && given_name) {
            await adminUpdateUser(request.body.sub.sub, given_name, family_name);
        }

        const fieldsToUpdate = pickBy(identity)({
            family_name,
            given_name,
            media,
            preferences
        });

        console.log(request.body);

        const repository = AppDataSource.getRepository(User);
        await repository.update(
            { sub: request.body.sub.sub },
            { ...fieldsToUpdate }
        );

        response.send();
    } catch (err) {
        if (err instanceof Error) {
            response.status(400).send({ message: err.message });
        } else {
            response.status(400).send({ message: 'Unknown error', error: err });
        }
    }
}


/**
 * curl localhost:8081/me/saved/experiences
 **/
export async function savedExperiences(request: Request, response: Response) {
    try {
        const repository = AppDataSource.getRepository(User);
        const where = {
            sub: request.body.sub.sub,
        };

        const user = await repository.findOne({
            relations: [
                "saved_experiences",
                "saved_experiences.media",
                "saved_experiences.organisation",
                "saved_experiences.sub",
                "saved_experiences.sub.media",
            ],
            where: { ...where },
        });

        if (!user) {
            response.status(404).send({ message: "User not found" });
            return;
        }

        response.send(user.saved_experiences);

    } catch (err) {
        if (err instanceof Error) {
            response.status(400).send({ message: err.message });
        } else {
            response.status(400).send({ message: 'Unknown error', error: err });
        }
    }
}

export async function removeMfa(request: Request, response: Response) {
    try {
        const id = request.params.id;
        await adminRemoveMfa(id);

        response.status(200).send();
    } catch (err) {
        if (err instanceof Error) {
            response.status(400).send({ message: err.message });
        } else {
            response.status(400).send({ message: 'Unknown error', error: err });
        }
    }
}

export async function enableUser(request: Request, response: Response) {
    try {
        const id = request.params.id;
        await adminEnableUser(id);

        const repository = AppDataSource.getRepository(User);
        await repository.update({ sub: id }, { disabled: false });
        response.status(200).send();
    } catch (err) {
        if (err instanceof Error) {
            response.status(400).send({ message: err.message });
        } else {
            response.status(400).send({ message: 'Unknown error', error: err });
        }
    }
}

export async function disableUser(request: Request, response: Response) {
    try {
        const id = request.params.id;
        await adminEnableUser(id, false);

        const repository = AppDataSource.getRepository(User);
        await repository.update({ sub: id }, { disabled: true });
        response.status(200).send();
    } catch (err) {
        if (err instanceof Error) {
            response.status(400).send({ message: err.message });
        } else {
            response.status(400).send({ message: 'Unknown error', error: err });
        }
    }
}

export async function resetUsersPassword(request: Request, response: Response) {
    try {
        const id = request.params.id;
        await adminResetUsersPassword(id);
        response.status(200).send();
    } catch (err) {
        if (err instanceof Error) {
            response.status(400).send({ message: err.message });
        } else {
            response.status(400).send({ message: 'Unknown error', error: err });
        }
    }
}
