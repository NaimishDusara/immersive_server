import User from "./user";
import Admin from "./admin";
import Media from "./media";
import Organisations from "./organisation";

const Routes = [
    ...Admin,
    ...User,
    ...Media,
    ...Organisations

  ];
  
  export default Routes;
  