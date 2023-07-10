import AuthAdmin from './AuthAdmin'
import express from 'express';

const AuchCheck = async (req: any) => {
    const token = req
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