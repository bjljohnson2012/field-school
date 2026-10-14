import type { Access } from "payload";

/** Operator session only. Parents, learners, and tracked children are not Payload users. */
export const operatorOnly: Access = ({ req }) => Boolean(req.user);
