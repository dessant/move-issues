const Joi = require('joi');

const schema = Joi.object().keys({
  deleteCommand: Joi.boolean()
    .default(true)
    .description(
      'Delete the command comment when it contains no other content'
    ),

  closeSourceIssue: Joi.boolean()
    .default(true)
    .description('Close the source issue after moving'),

  lockSourceIssue: Joi.boolean()
    .default(false)
    .description('Lock the source issue after moving'),

  mentionAuthors: Joi.boolean()
    .default(true)
    .description('Mention issue and comment authors'),

  keepContentMentions: Joi.boolean()
    .default(false)
    .description('Preserve mentions in the issue content'),

  moveLabels: Joi.boolean()
    .default(true)
    .description('Move labels that also exist on the target repository'),

  aliases: Joi.object()
    .pattern(
      Joi.string()
        .trim()
        .max(100),
      Joi.string()
        .trim()
        .max(140)
    )
    .default({})
    .description('Set custom aliases for targets'),

  _extends: Joi.string()
    .trim()
    .max(260)
    .description('Repository to extend settings from'),

  perform: Joi.boolean().default(!process.env.DRY_RUN)
});

module.exports = schema;
