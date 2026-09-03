-- Oncogeriatria longitudinal v1.
-- Exclusively additive: new tables, indexes, foreign keys and scale metadata only.
-- No existing clinical table, column, enum or index is altered.

CREATE TABLE `OncogeriatricEpisode` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    `diagnosis` VARCHAR(255) NOT NULL,
    `primarySite` VARCHAR(191) NULL,
    `histology` VARCHAR(255) NULL,
    `stage` VARCHAR(100) NULL,
    `diagnosedAt` DATETIME(3) NULL,
    `diseaseStatus` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OncoEpisode_id_patient_key`(`id`, `patientId`),
    INDEX `OncoEpisode_patient_status_created_idx`(`patientId`, `status`, `createdAt`),
    INDEX `OncoEpisode_author_created_idx`(`createdById`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OncogeriatricTreatmentCourse` (
    `id` VARCHAR(191) NOT NULL,
    `episodeId` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `modality` VARCHAR(64) NOT NULL,
    `intent` VARCHAR(64) NOT NULL,
    `therapyLine` VARCHAR(100) NULL,
    `regimenName` VARCHAR(255) NOT NULL,
    `plannedCycles` INTEGER NULL,
    `plannedStartAt` DATETIME(3) NULL,
    `actualStartAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PLANNED',
    `riskFlags` JSON NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OncoCourse_id_episode_patient_key`(`id`, `episodeId`, `patientId`),
    INDEX `OncoCourse_episode_status_idx`(`episodeId`, `status`),
    INDEX `OncoCourse_patient_start_idx`(`patientId`, `actualStartAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OncogeriatricCheckpoint` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `episodeId` VARCHAR(191) NOT NULL,
    `treatmentCourseId` VARCHAR(191) NULL,
    `consultationId` VARCHAR(191) NULL,
    `type` VARCHAR(48) NOT NULL,
    `cycleNumber` INTEGER NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `scheduledAt` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
    `structuredData` JSON NULL,
    `g8AssessmentId` VARCHAR(191) NULL,
    `cargAssessmentId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OncoCheckpoint_id_episode_patient_key`(`id`, `episodeId`, `patientId`),
    INDEX `OncoCheckpoint_patient_occurred_idx`(`patientId`, `occurredAt`),
    INDEX `OncoCheckpoint_episode_type_occurred_idx`(`episodeId`, `type`, `occurredAt`),
    INDEX `OncoCheckpoint_course_occurred_idx`(`treatmentCourseId`, `occurredAt`),
    INDEX `OncoCheckpoint_status_scheduled_idx`(`status`, `scheduledAt`),
    INDEX `OncoCheckpoint_consultation_patient_idx`(`consultationId`, `patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OncogeriatricIntervention` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `episodeId` VARCHAR(191) NOT NULL,
    `checkpointId` VARCHAR(191) NULL,
    `domain` VARCHAR(64) NOT NULL,
    `description` TEXT NOT NULL,
    `intervention` TEXT NULL,
    `responsibleProfessional` VARCHAR(191) NULL,
    `dueAt` DATETIME(3) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'PLANNED',
    `result` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OncoIntervention_episode_status_idx`(`episodeId`, `status`),
    INDEX `OncoIntervention_patient_domain_idx`(`patientId`, `domain`),
    INDEX `OncoIntervention_checkpoint_idx`(`checkpointId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OncogeriatricToxicityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `episodeId` VARCHAR(191) NOT NULL,
    `treatmentCourseId` VARCHAR(191) NULL,
    `checkpointId` VARCHAR(191) NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `toxicityType` VARCHAR(191) NOT NULL,
    `grade` VARCHAR(32) NULL,
    `consequences` TEXT NULL,
    `hospitalizationAssociated` BOOLEAN NOT NULL DEFAULT false,
    `cycleDelayAssociated` BOOLEAN NOT NULL DEFAULT false,
    `treatmentModificationRecorded` TEXT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OncoToxicity_episode_occurred_idx`(`episodeId`, `occurredAt`),
    INDEX `OncoToxicity_patient_occurred_idx`(`patientId`, `occurredAt`),
    INDEX `OncoToxicity_course_occurred_idx`(`treatmentCourseId`, `occurredAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OncogeriatricRecoveryAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `episodeId` VARCHAR(191) NOT NULL,
    `checkpointId` VARCHAR(191) NULL,
    `domain` VARCHAR(64) NOT NULL,
    `status` VARCHAR(32) NOT NULL,
    `notes` TEXT NULL,
    `assessedAt` DATETIME(3) NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OncoRecovery_episode_domain_idx`(`episodeId`, `domain`, `assessedAt`),
    INDEX `OncoRecovery_patient_assessed_idx`(`patientId`, `assessedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OncogeriatricReportSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `episodeId` VARCHAR(191) NOT NULL,
    `consultationId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL,
    `content` JSON NOT NULL,
    `generatedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OncoReport_episode_version_key`(`episodeId`, `version`),
    INDEX `OncoReport_patient_created_idx`(`patientId`, `createdAt`),
    INDEX `OncoReport_consultation_patient_idx`(`consultationId`, `patientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `OncogeriatricEpisode`
    ADD CONSTRAINT `OncoEpisode_patient_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoEpisode_author_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricTreatmentCourse`
    ADD CONSTRAINT `OncoCourse_episode_patient_fkey` FOREIGN KEY (`episodeId`, `patientId`) REFERENCES `OncogeriatricEpisode`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoCourse_patient_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoCourse_author_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricCheckpoint`
    ADD CONSTRAINT `OncoCheckpoint_episode_patient_fkey` FOREIGN KEY (`episodeId`, `patientId`) REFERENCES `OncogeriatricEpisode`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoCheckpoint_patient_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoCheckpoint_consultation_fkey` FOREIGN KEY (`consultationId`, `patientId`) REFERENCES `Consultation`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoCheckpoint_g8_fkey` FOREIGN KEY (`g8AssessmentId`) REFERENCES `ScaleAssessment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoCheckpoint_carg_fkey` FOREIGN KEY (`cargAssessmentId`) REFERENCES `ScaleAssessment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoCheckpoint_author_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricIntervention`
    ADD CONSTRAINT `OncoIntervention_episode_patient_fkey` FOREIGN KEY (`episodeId`, `patientId`) REFERENCES `OncogeriatricEpisode`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoIntervention_checkpoint_fkey` FOREIGN KEY (`checkpointId`) REFERENCES `OncogeriatricCheckpoint`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoIntervention_patient_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoIntervention_author_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricToxicityEvent`
    ADD CONSTRAINT `OncoToxicity_episode_patient_fkey` FOREIGN KEY (`episodeId`, `patientId`) REFERENCES `OncogeriatricEpisode`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoToxicity_checkpoint_fkey` FOREIGN KEY (`checkpointId`) REFERENCES `OncogeriatricCheckpoint`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoToxicity_patient_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoToxicity_author_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricRecoveryAssessment`
    ADD CONSTRAINT `OncoRecovery_episode_patient_fkey` FOREIGN KEY (`episodeId`, `patientId`) REFERENCES `OncogeriatricEpisode`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoRecovery_checkpoint_fkey` FOREIGN KEY (`checkpointId`) REFERENCES `OncogeriatricCheckpoint`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoRecovery_patient_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoRecovery_author_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricReportSnapshot`
    ADD CONSTRAINT `OncoReport_episode_patient_fkey` FOREIGN KEY (`episodeId`, `patientId`) REFERENCES `OncogeriatricEpisode`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoReport_patient_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoReport_consultation_fkey` FOREIGN KEY (`consultationId`, `patientId`) REFERENCES `Consultation`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `OncoReport_author_fkey` FOREIGN KEY (`generatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- ScaleDefinition remains the single scale registry. These records provide source/version metadata;
-- scoring stays in tested domain code, not in React or external calculators.
INSERT INTO `ScaleDefinition` (`id`, `code`, `version`, `name`, `dimension`, `sourceStatus`, `sourceCitation`, `sourceNote`, `interpretationConfig`, `interventionConfig`, `definitionHash`, `reviewedAt`, `config`, `isActive`, `createdAt`, `updatedAt`)
VALUES
('onco_g8_original_2012', 'G8', 'ORIGINAL_2012', 'G8 — Geriatric 8', 'Oncogeriatria', 'REVIEWED', 'Bellera CA et al. Ann Oncol. 2012;23(8):2166-2172. doi:10.1093/annonc/mdr587.', 'Triagem geriátrica oncológica. Resultado <=14 sinaliza vulnerabilidade e necessidade de avaliação geriátrica; não determina tratamento oncológico.', JSON_OBJECT('cutoff', 14, 'operator', '<='), NULL, 'g8-original-2012-onco-v1', '2026-09-02 00:00:00.000', JSON_OBJECT('calculator', 'domain:oncogeriatria/calculateG8', 'scoreMin', 0, 'scoreMax', 17), true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('onco_carg_hurria_2011', 'CARG', 'HURRIA_2011', 'CARG — Chemotherapy Toxicity Risk', 'Oncogeriatria', 'REVIEWED', 'Hurria A et al. J Clin Oncol. 2011;29(25):3457-3465. doi:10.1200/JCO.2011.34.7625.', 'Estimativa de risco de toxicidade grau 3-5 para apoio à decisão compartilhada. Nunca gera ajuste, suspensão ou escolha de esquema.', JSON_OBJECT('lowMax', 5, 'intermediateMax', 9, 'highMin', 10), NULL, 'carg-hurria-2011-onco-v1', '2026-09-02 00:00:00.000', JSON_OBJECT('calculator', 'domain:oncogeriatria/calculateCarg', 'observedOriginalRangeMax', 19), true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE `updatedAt` = `updatedAt`;
