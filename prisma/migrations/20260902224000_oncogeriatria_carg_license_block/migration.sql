-- Safety block for CARG electronic implementation.
-- The scientific model remains referenced, but the local electronic instrument is inactive
-- until formal copyright/licensing authorization is documented.
-- No patient data is modified and no existing clinical schema is changed.

UPDATE `ScaleDefinition`
SET
  `sourceStatus` = 'LICENSE_REVIEW_REQUIRED',
  `sourceNote` = 'Implementação eletrônica local bloqueada até autorização formal de copyright/licenciamento do CARG-TT. Não reproduzir questionário, algoritmo ou tradução no Prontuário Aprimorado até liberação documentada.',
  `interpretationConfig` = NULL,
  `interventionConfig` = NULL,
  `config` = JSON_OBJECT(
    'implementation', 'BLOCKED_LICENSE',
    'externalTransmission', false,
    'reason', 'CARG_LICENSE_REVIEW_REQUIRED'
  ),
  `isActive` = false,
  `updatedAt` = CURRENT_TIMESTAMP(3)
WHERE `code` = 'CARG' AND `version` = 'HURRIA_2011';
