import { Request } from "express";
import Headers from "./headers";

test("Reads values from headers and adds to request body", () => {
  const req = {
    headers: {
      "immersive-interactive-source-ip": "test",
    },

    body: {
      value: true,
    },
  };

  Headers(req, null, () => {
    expect(req.body["source_ip"]).toBe("test");
    expect(req.body.value).toBe(true);
  });
});
