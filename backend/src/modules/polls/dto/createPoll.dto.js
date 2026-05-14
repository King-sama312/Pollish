import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class CreatePollDto extends BaseDto {
  static schema = Joi.object({
    creatorId: Joi.string().uuid().required(),
    question: Joi.string().trim().min(1).max(500).required(),
    description: Joi.string().trim().max(2000).allow(""),
    isAnonymous: Joi.boolean().default(false),
    allowMultipleChoices: Joi.boolean().default(false),
    endAt: Joi.date().greater("now"),

    options: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().trim().min(1).max(200).required(),
          // optional: id, order, mediaUrl, etc.
        }),
      )
      .min(2)
      .max(20)
      .required(),
  });
}


export default CreatePollDto