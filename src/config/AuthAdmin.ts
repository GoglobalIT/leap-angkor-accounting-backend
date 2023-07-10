import GoglobalAmin from './GoglobalAmin';
import serviceAccount from './keyService.json';

const AuthAdmin = new GoglobalAmin();
AuthAdmin.initializeApp(serviceAccount.app_id, serviceAccount.key, serviceAccount.url, serviceAccount.user, serviceAccount.user_key)

export default AuthAdmin;