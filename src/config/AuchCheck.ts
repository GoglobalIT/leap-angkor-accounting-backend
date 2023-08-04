import AuthAdmin from './AuthAdmin'
import express from 'express';

const AuchCheck = async (req: express.Request) => {
    const token = req.headers.authorization
    // console.log(token, "graphQLClient")
    const verify = await AuthAdmin.verifyToken(token);
    if (verify.status) {
        return verify
    } else {
        return {
            status: verify.status,
            message: "Not Authorized"
        }
    }
}

export default AuchCheck;