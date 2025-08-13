import { z } from "zod";

// Product schema
const create = z.object({
  name: z.string(),
});

const tempValidaton = {
  create,
};

export default tempValidaton;
