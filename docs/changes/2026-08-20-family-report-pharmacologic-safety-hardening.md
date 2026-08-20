# Family report pharmacologic safety hardening

## Context

The family/caregiver report is intended to provide educational, practical and safe guidance. Medication prescribing, dose adjustment and supplement prescribing remain clinician-only decisions and must not be emitted as automatic family instructions.

The existing safety filter already blocked several known phrases (for example statins, vitamin D replacement and generic prescribing language), but named-medication instructions such as `Manter losartana 50 mg` or `Reduzir sertralina para 25 mg` could bypass those narrower patterns.

## Change

- broaden medication-conduct detection to cover treatment verbs combined with generic medication/supplement terms;
- block treatment verbs followed by explicit dose units such as mg, mcg, g, mL or UI, which catches named-drug prescription sentences without maintaining a drug-name list;
- block generic dose-maintenance/titration language;
- preserve explicit safety guidance telling patients/caregivers not to start, stop or change medicines/supplements on their own and to contact the care team;
- add golden-master coverage for named medications, dose changes, generic medication continuation and self-medication safety language.

## Safety boundaries

This change does not alter any medication, dose, indication, scale, score, diagnosis or clinical plan. It only filters automatic family-facing text. The professional/clinical workspace remains the place for clinician-reviewed treatment decisions.
