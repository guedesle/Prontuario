-- Oncogeriatria relational hardening.
-- Additive indexes/FKs only; protects patient/episode/course/checkpoint identity at database level.

CREATE INDEX `OncoCheckpoint_course_episode_patient_idx`
  ON `OncogeriatricCheckpoint`(`treatmentCourseId`, `episodeId`, `patientId`);

CREATE INDEX `OncoIntervention_checkpoint_episode_patient_idx`
  ON `OncogeriatricIntervention`(`checkpointId`, `episodeId`, `patientId`);

CREATE INDEX `OncoToxicity_course_episode_patient_idx`
  ON `OncogeriatricToxicityEvent`(`treatmentCourseId`, `episodeId`, `patientId`);

CREATE INDEX `OncoToxicity_checkpoint_episode_patient_idx`
  ON `OncogeriatricToxicityEvent`(`checkpointId`, `episodeId`, `patientId`);

CREATE INDEX `OncoRecovery_checkpoint_episode_patient_idx`
  ON `OncogeriatricRecoveryAssessment`(`checkpointId`, `episodeId`, `patientId`);

ALTER TABLE `OncogeriatricCheckpoint`
  ADD CONSTRAINT `OncoCheckpoint_course_episode_patient_fkey`
    FOREIGN KEY (`treatmentCourseId`, `episodeId`, `patientId`)
    REFERENCES `OncogeriatricTreatmentCourse`(`id`, `episodeId`, `patientId`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricIntervention`
  ADD CONSTRAINT `OncoIntervention_checkpoint_episode_patient_fkey`
    FOREIGN KEY (`checkpointId`, `episodeId`, `patientId`)
    REFERENCES `OncogeriatricCheckpoint`(`id`, `episodeId`, `patientId`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricToxicityEvent`
  ADD CONSTRAINT `OncoToxicity_course_episode_patient_fkey`
    FOREIGN KEY (`treatmentCourseId`, `episodeId`, `patientId`)
    REFERENCES `OncogeriatricTreatmentCourse`(`id`, `episodeId`, `patientId`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `OncoToxicity_checkpoint_episode_patient_fkey`
    FOREIGN KEY (`checkpointId`, `episodeId`, `patientId`)
    REFERENCES `OncogeriatricCheckpoint`(`id`, `episodeId`, `patientId`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OncogeriatricRecoveryAssessment`
  ADD CONSTRAINT `OncoRecovery_checkpoint_episode_patient_fkey`
    FOREIGN KEY (`checkpointId`, `episodeId`, `patientId`)
    REFERENCES `OncogeriatricCheckpoint`(`id`, `episodeId`, `patientId`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
