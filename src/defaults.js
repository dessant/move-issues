module.exports = {
  perform: !process.env.DRY_RUN,
  deleteCommand: true,
  closeSourceIssue: true,
  lockSourceIssue: false,
  mentionAuthors: true,
  keepContentMentions: false,
  aliases: {}
};
