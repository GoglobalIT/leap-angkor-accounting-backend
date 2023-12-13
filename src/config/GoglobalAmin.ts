import axios from 'axios';
import { ObjectId } from 'mongoose';

class Goglobalauth {
    verify = false;
    url = "";
    app = ""

    async initializeApp(app_id: string, key: string, url: string, email: string, password: string) {
        try {
            const logIn = await axios({
                method: 'post',
                url: url + "/admin/login",
                data: {
                    email,
                    password
                }
            })
            if (!logIn.data) {
                this.url = "";
                this.verify = false;
                this.app = ""
            }
            const init = await axios({
                method: 'post',
                url: url + "/app/init",
                data: {
                    app_id,
                    key
                }
            });
            if (init.data.status) {
                this.url = url;
                this.verify = true;
                this.app = app_id
            }
        } catch (error) {
            return error
        }
    }
    async createUser(user_id: string, email: string, password: string, firstName: string, lastName: string, role: string) {
        try {

            if (!this.verify) {
                return {
                    message: "You not register yet!",
                    status: false
                }
            }
            const user = await axios({
                method: 'post',
                url: this.url + "/user/create",
                data: {
                    user_id,
                    email,
                    password,
                    firstName,
                    lastName,
                    role,
                    app: this.app
                }
            });
            if (user.data.status) {
                return {
                    message: "Create User Success!",
                    status: true,
                    data: user
                }
            } else {
                return {
                    message: user.data.message,
                    status: false,
                }
            }

        } catch (error) {

            return {
                message: error.message,
                status: false,
            }
        }

    }
    async updateUser(user_id: string, email: string, password: string, firstName: string, lastName: string, role: string) {

        try {
            if (!this.verify) {
                return {
                    message: "You not register yet!",
                    status: false
                }
            }
            const user = await axios({
                method: 'post',
                url: this.url + "/user/update",
                data: {
                    user_id,
                    email,
                    password,
                    firstName,
                    lastName,
                    role,
                    app: this.app
                }
            });

            if (user.data.status) {
                return {
                    message: "Update User Success!",
                    status: true,
                    data: user
                }
            } else {
                return {
                    message: user.data.message,
                    status: false,
                }
            }
        } catch (error) {
            return {
                message: error.message,
                status: false,
            }
        }

    }
    async updateUserInfo(user_id: string, email: string, firstName: string, lastName: string, role: string) {
  
        try {
            if (!this.verify) {
                return {
                    message: "You not register yet!",
                    status: false
                }
            }
            const user = await axios({
                method: 'post',
                url: this.url + "/users/updateinfo",
                data: {
                    user_id,
                    email,
                    firstName,
                    lastName,
                    role,
                    app: this.app
                }
            });

            if (user.data.status) {
                return {
                    message: "Update User Info Success!",
                    status: true,
                    data: user
                }
            } else {
                return {
                    message: user.data.message,
                    status: false,
                }
            }
        } catch (error) {
            return {
                message: error.message,
                status: false,
            }
        }

    }
    async delete(user_id: string) {
        try {
            if (!this.verify) {
                return {
                    message: "You not register yet!",
                    status: false
                }
            }
            const role = "admin"
            const user = await axios({
                method: 'post',
                url: this.url + "/user/delete",
                data: {
                    user_id,
                    role,
                    app: this.app
                }
            });
            if (user.data.status) {
                return {
                    message: "Delete User Success!",
                    status: true,
                    data: user
                }
            }
            else {
                return {
                    message: user.data.message,
                    status: false,
                }

            }
        } catch (error) {
            return {
                message: error.message,
                status: false,
            }
        }

    }

    async verifyToken(token: string) {
        const verifyToken = await axios({
            method: 'post',
            url: this.url + "/auth/verifyToken",
            data: {
                token
            }
        })
        // console.log(verifyToken, "verifyToken")
        if (verifyToken.data.status) {
            return {
                message: "Verify token Success!",
                status: true,
                user: verifyToken.data.user
            }
        } else {
            return {
                message: "Verify token failed",
                status: false,
            }
        }
    }
    async refreshToken(user_id: string) {
        const verifyToken = await axios({
            method: 'post',
            url: this.url + "/auth/refreshToken",
            data: {
                app: this.app,
                user_id
            }
        })
        if (verifyToken.data.status) {
            return {
                message: "Refresh token Success!",
                status: true,
            }
        } else {
            return {
                message: "Refresh token failed",
                status: false,
            }
        }
    }
    async login(email: string, password: string) {
        try {
            const user = await axios({
                method: 'post',
                url: this.url + "/auth/login",
                data: {
                    email,
                    password,
                    app: this.app
                }
            })
            if (user.data.status) {
                return {
                    message: user.data.message,
                    status: true,
                    token: user.data.token,
                    user: user.data.user
                }
            } {
                return {
                    message: user.data.message,
                    status: false,
                    token: ""
                }
            }

        } catch (error) {
            // console.log(error)
            return {
                message: error.message,
                status: false,
            }
        }

    }

}

export default Goglobalauth;