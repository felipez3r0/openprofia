import S from 'fluent-json-schema';

/**
 * Schema de response de upload
 */
export const uploadResponseSchema = S.object()
  .prop('jobId', S.string())
  .prop(
    'status',
    S.string().enum(['pending', 'processing', 'completed', 'failed']),
  );

/**
 * Schema de job status
 */
export const jobStatusSchema = S.object()
  .prop('id', S.string())
  .prop('skillId', S.string())
  .prop('filePath', S.string())
  .prop('fileName', S.string())
  .prop(
    'status',
    S.string().enum(['pending', 'processing', 'completed', 'failed']),
  )
  .prop('error', S.string())
  .prop('progress', S.number())
  .prop('createdAt', S.string().format('date-time'))
  .prop('updatedAt', S.string().format('date-time'))
  .prop('startedAt', S.string().format('date-time'))
  .prop('completedAt', S.string().format('date-time'));

/**
 * Schema de lista de jobs
 */
export const jobsListSchema = S.array().items(jobStatusSchema);
