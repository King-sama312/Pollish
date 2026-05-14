import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class RegisterDto extends BaseDto{
    static schema = Joi.object({
        name: Joi.string().trim().min(2).max(50).required(),
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().min(8).max(200).message("Password must contain atleast 8 characters").required(),
    })
}

export default RegisterDto