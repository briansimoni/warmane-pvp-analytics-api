import Koa from "koa";
import serverless from "aws-serverless-koa";
import { ApiGatewayContext, AwsMiddleware } from "./middleware";
import { router } from "./routes";

const app = new Koa<Koa.DefaultState, ApiGatewayContext>();

app.use(AwsMiddleware({}));

app.use(router.routes());

// if (process.env.AWS_EXECUTION_ENV === undefined) {
//   app.listen(3000, () => {
//     console.log("server listening on 3000");
//   });
// }

export const handler = serverless(app);
