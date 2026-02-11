import { S } from 'fluent-json-schema';

/**
 * Schema de response de skill
 */
export const skillResponseSchema = S.object()
  .prop('id', S.string())
  .prop(
    'manifest',
    S.object()
      .prop('id', S.string())
      .prop('name', S.string())
      .prop('version', S.string())
      .prop('description', S.string())
      .prop('author', S.string())
      .prop('capabilities', S.array().items(S.string()))
      .prop('tools', S.array().items(S.string()))
      .prop(
        'modelPreferences',
        S.object().prop('chat', S.string()).prop('embedding', S.string()),
      ),
  )
  .prop('installedAt', S.string().format('date-time'))
  .prop('path', S.string())
  .prop('hasKnowledge', S.boolean());

/**
 * Schema de lista de skills
 */
export const skillsListResponseSchema = S.array().items(skillResponseSchema);

/**
 * Schema de criação de skill
 */
export const createSkillResponseSchema = S.object()
  .prop('skillId', S.string())
  .prop('name', S.string())
  .prop('version', S.string())
  .prop('missingModels', S.array().items(S.string()));

/**
 * Schema de verificação de modelos
 */
export const modelCheckResponseSchema = S.object()
  .prop('available', S.array().items(S.string()))
  .prop('missing', S.array().items(S.string()));
