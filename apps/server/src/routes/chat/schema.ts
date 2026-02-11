import { S } from 'fluent-json-schema';

/**
 * Schema de request de chat
 */
export const chatRequestSchema = S.object()
  .prop('skillId', S.string().required())
  .prop(
    'messages',
    S.array()
      .items(
        S.object()
          .prop(
            'role',
            S.string().enum(['system', 'user', 'assistant']).required(),
          )
          .prop('content', S.string().required())
          .prop('timestamp', S.string().format('date-time')),
      )
      .required()
      .minItems(1),
  )
  .prop('stream', S.boolean().default(false))
  .prop('temperature', S.number().minimum(0).maximum(2).default(0.7))
  .prop('maxTokens', S.number().minimum(1).maximum(4096));

/**
 * Schema de response de chat
 */
export const chatResponseSchema = S.object()
  .prop(
    'message',
    S.object()
      .prop('role', S.string().enum(['assistant']))
      .prop('content', S.string())
      .prop('timestamp', S.string().format('date-time')),
  )
  .prop('model', S.string())
  .prop(
    'contextUsed',
    S.object()
      .prop('chunks', S.number())
      .prop('sources', S.array().items(S.string())),
  );

/**
 * Schema de stream event
 */
export const chatStreamEventSchema = S.object()
  .prop('type', S.string().enum(['token', 'done', 'error']).required())
  .prop('content', S.string())
  .prop('error', S.string());
