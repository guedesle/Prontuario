-- DropForeignKey
ALTER TABLE `ClinicalProblem` DROP FOREIGN KEY `ClinicalProblem_originConsultationId_fkey`;

-- DropForeignKey
ALTER TABLE `ProblemEvent` DROP FOREIGN KEY `ProblemEvent_problemId_fkey`;

-- DropForeignKey
ALTER TABLE `ProblemEvent` DROP FOREIGN KEY `ProblemEvent_consultationId_fkey`;

-- DropForeignKey
ALTER TABLE `ScaleAssessment` DROP FOREIGN KEY `ScaleAssessment_consultationId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationRegimen` DROP FOREIGN KEY `MedicationRegimen_medicationId_fkey`;

-- DropForeignKey
ALTER TABLE `MedicationRegimen` DROP FOREIGN KEY `MedicationRegimen_consultationId_fkey`;

-- DropForeignKey
ALTER TABLE `DocumentSnapshot` DROP FOREIGN KEY `DocumentSnapshot_consultationId_fkey`;

-- AlterTable
ALTER TABLE `Patient` ADD COLUMN `homonymDiscriminator` VARCHAR(191) NOT NULL DEFAULT 'primary',
    ADD COLUMN `identityFingerprint` VARCHAR(191) NULL,
    ADD COLUMN `needsIdentityReview` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `normalizedFullName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ProblemEvent` ADD COLUMN `patientId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ScaleDefinition` ADD COLUMN `definitionHash` VARCHAR(191) NULL,
    ADD COLUMN `dimension` VARCHAR(191) NULL,
    ADD COLUMN `interpretationConfig` JSON NULL,
    ADD COLUMN `interventionConfig` JSON NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `sourceCitation` TEXT NULL,
    ADD COLUMN `sourceNote` TEXT NULL;

-- AlterTable
ALTER TABLE `MedicationRegimen` ADD COLUMN `continuous` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `needsScheduleReview` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `patientId` VARCHAR(191) NULL,
    ADD COLUMN `route` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `DocumentSnapshot` ADD COLUMN `contentSchemaVersion` VARCHAR(191) NOT NULL DEFAULT '1.0',
    ADD COLUMN `generatedById` VARCHAR(191) NULL,
    ADD COLUMN `sourceConsultationStatus` ENUM('DRAFT', 'IN_REVIEW', 'FINALIZED') NULL,
    MODIFY `type` ENUM('SOAP', 'FAMILY_REPORT', 'MEDICATION_PLAN', 'AGA_REPORT') NOT NULL;

-- CreateTable
CREATE TABLE `PatientIdentifier` (
    `id` VARCHAR(191) NOT NULL,
    `patientId` VARCHAR(191) NOT NULL,
    `type` ENUM('CPF', 'CNS', 'MEDICAL_RECORD', 'OTHER') NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `normalizedValue` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PatientIdentifier_patientId_idx`(`patientId`),
    UNIQUE INDEX `PatientIdentifier_type_normalizedValue_key`(`type`, `normalizedValue`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicationScheduleSlot` (
    `id` VARCHAR(191) NOT NULL,
    `regimenId` VARCHAR(191) NOT NULL,
    `moment` ENUM('MORNING', 'LUNCH', 'AFTERNOON', 'EVENING', 'BEDTIME', 'AS_NEEDED') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MedicationScheduleSlot_moment_idx`(`moment`),
    UNIQUE INDEX `MedicationScheduleSlot_regimenId_moment_key`(`regimenId`, `moment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill conservador antes de ativar NOT NULL e chaves compostas.
-- A cadeia de REPLACE reproduz a remoção dos diacríticos portugueses mais usuais;
-- todos os grupos colidentes permanecem separados e marcados para revisão.
UPDATE `Patient`
SET `normalizedFullName` =
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  REPLACE(REGEXP_REPLACE(LOWER(TRIM(`fullName`)), '[[:space:]]+', ' '),
  'á','a'),'à','a'),'â','a'),'ã','a'),'ä','a'),
  'é','e'),'è','e'),'ê','e'),'ë','e'),
  'í','i'),'ì','i'),'î','i'),'ï','i'),
  'ó','o'),'ò','o'),'ô','o'),'õ','o'),'ö','o'),
  'ú','u');

UPDATE `Patient`
SET `normalizedFullName` = REPLACE(REPLACE(REPLACE(REPLACE(`normalizedFullName`,
    'ù','u'),'û','u'),'ü','u'),'ç','c'),
    `identityFingerprint` = CONCAT(
      REPLACE(REPLACE(REPLACE(REPLACE(`normalizedFullName`,'ù','u'),'û','u'),'ü','u'),'ç','c'),
      '::', COALESCE(DATE_FORMAT(`birthDate`, '%Y-%m-%d'), 'unknown')
    );

UPDATE `Patient` AS patient
JOIN (
  SELECT `identityFingerprint`
  FROM `Patient`
  GROUP BY `identityFingerprint`
  HAVING COUNT(*) > 1
) AS duplicate_group
  ON duplicate_group.`identityFingerprint` = patient.`identityFingerprint`
SET patient.`homonymDiscriminator` = patient.`id`,
    patient.`needsIdentityReview` = true;

UPDATE `ProblemEvent` AS event
JOIN `ClinicalProblem` AS problem ON problem.`id` = event.`problemId`
SET event.`patientId` = problem.`patientId`;

UPDATE `MedicationRegimen` AS regimen
JOIN `Medication` AS medication ON medication.`id` = regimen.`medicationId`
SET regimen.`patientId` = medication.`patientId`,
    regimen.`route` = COALESCE(regimen.`route`, medication.`route`),
    regimen.`needsScheduleReview` = regimen.`frequency` IS NOT NULL OR regimen.`schedule` IS NOT NULL;

UPDATE `DocumentSnapshot` AS snapshot
JOIN `Consultation` AS consultation ON consultation.`id` = snapshot.`consultationId`
SET snapshot.`sourceConsultationStatus` = consultation.`status`;

ALTER TABLE `Patient`
  MODIFY `normalizedFullName` VARCHAR(191) NOT NULL,
  MODIFY `identityFingerprint` VARCHAR(191) NOT NULL;

ALTER TABLE `ProblemEvent` MODIFY `patientId` VARCHAR(191) NOT NULL;
ALTER TABLE `MedicationRegimen` MODIFY `patientId` VARCHAR(191) NOT NULL;
ALTER TABLE `DocumentSnapshot`
  MODIFY `sourceConsultationStatus` ENUM('DRAFT', 'IN_REVIEW', 'FINALIZED') NOT NULL;

-- CreateIndex
CREATE INDEX `Patient_normalizedFullName_birthDate_idx` ON `Patient`(`normalizedFullName`, `birthDate`);

-- CreateIndex
CREATE UNIQUE INDEX `Patient_identityFingerprint_homonymDiscriminator_key` ON `Patient`(`identityFingerprint`, `homonymDiscriminator`);

-- CreateIndex
CREATE UNIQUE INDEX `Consultation_id_patientId_key` ON `Consultation`(`id`, `patientId`);

-- CreateIndex
CREATE UNIQUE INDEX `ClinicalProblem_id_patientId_key` ON `ClinicalProblem`(`id`, `patientId`);

-- CreateIndex
CREATE UNIQUE INDEX `Medication_id_patientId_key` ON `Medication`(`id`, `patientId`);

-- AddForeignKey
ALTER TABLE `PatientIdentifier` ADD CONSTRAINT `PatientIdentifier_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClinicalProblem` ADD CONSTRAINT `ClinicalProblem_originConsultationId_patientId_fkey` FOREIGN KEY (`originConsultationId`, `patientId`) REFERENCES `Consultation`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProblemEvent` ADD CONSTRAINT `ProblemEvent_problemId_patientId_fkey` FOREIGN KEY (`problemId`, `patientId`) REFERENCES `ClinicalProblem`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProblemEvent` ADD CONSTRAINT `ProblemEvent_consultationId_patientId_fkey` FOREIGN KEY (`consultationId`, `patientId`) REFERENCES `Consultation`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ScaleAssessment` ADD CONSTRAINT `ScaleAssessment_consultationId_patientId_fkey` FOREIGN KEY (`consultationId`, `patientId`) REFERENCES `Consultation`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationRegimen` ADD CONSTRAINT `MedicationRegimen_medicationId_patientId_fkey` FOREIGN KEY (`medicationId`, `patientId`) REFERENCES `Medication`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationRegimen` ADD CONSTRAINT `MedicationRegimen_consultationId_patientId_fkey` FOREIGN KEY (`consultationId`, `patientId`) REFERENCES `Consultation`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicationScheduleSlot` ADD CONSTRAINT `MedicationScheduleSlot_regimenId_fkey` FOREIGN KEY (`regimenId`) REFERENCES `MedicationRegimen`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentSnapshot` ADD CONSTRAINT `DocumentSnapshot_consultationId_patientId_fkey` FOREIGN KEY (`consultationId`, `patientId`) REFERENCES `Consultation`(`id`, `patientId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentSnapshot` ADD CONSTRAINT `DocumentSnapshot_generatedById_fkey` FOREIGN KEY (`generatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
