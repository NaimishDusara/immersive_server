import User from "./user";
import Admin from "./admin";
import Media from "./media";
import Layout from "./layout";
import Space from "./space";

const Routes = [
    ...Admin,
    ...User,
    ...Media,
    ...Layout,
    ...Space

  ];
  
  export default Routes;
  