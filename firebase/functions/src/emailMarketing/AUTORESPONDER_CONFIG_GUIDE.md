# Autoresponder Configuration Guide
## Complete Setup for 99 Autoresponders (11 Types × 9 Languages)

This guide provides step-by-step instructions for configuring all 99 autoresponders in MailWizz for the SOS-Expat email marketing automation system.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Autoresponder Types](#autoresponder-types)
4. [Configuration Steps](#configuration-steps)
5. [Segment Combinations](#segment-combinations)
6. [Stop Conditions](#stop-conditions)
7. [Template Sequences](#template-sequences)
8. [Rate Limiting & Quiet Hours](#rate-limiting--quiet-hours)
9. [Verification Checklist](#verification-checklist)

---

## Overview

**Total Autoresponders**: 99 (11 types × 9 languages)

**Languages Supported**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Purpose**: Automated email sequences that nurture users through their journey, with automatic stops when users take specific actions.

---

## Prerequisites

Before configuring autoresponders, ensure:

- ✅ All 61 custom fields are created in MailWizz
- ✅ All 26 segments are created in MailWizz
- ✅ All 954 templates (106 × 9 languages) are uploaded to MailWizz
- ✅ List UID: `yl089ehqpgb96`
- ✅ Customer ID: `2`

---

## Autoresponder Types

### Type 1: Nurture Profile (9 autoresponders)
**Purpose**: Help providers complete their profile

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture Profile [LANG]` (e.g., "Nurture Profile EN", "Nurture Profile FR")
- **Description**: "Help providers complete their profile - [Language]"
- **Include Segments**: 
  - `profile_incomplete`
  - `language_[lang]` (e.g., `language_en`, `language_fr`)
- **Exclude Segments**:
  - `PROFILE_STATUS = "profile_complete"`
- **Trigger**: After subscribe
- **Send Time**: 09:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_PRO_nurture-profile_01_[LANG]`
  - Day 3: `CA_PRO_nurture-profile_02_[LANG]`
  - Day 7: `CA_PRO_nurture-profile_03_[LANG]`
  - Day 14: `CA_PRO_nurture-profile_04_[LANG]`
- **Stop Condition**: `PROFILE_STATUS = "profile_complete"`

---

### Type 2: Nurture No Calls (9 autoresponders)
**Purpose**: Encourage providers to get their first call

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture No Calls [LANG]`
- **Description**: "Encourage providers to get their first call - [Language]"
- **Include Segments**:
  - `providers_no_calls`
  - `language_[lang]`
- **Exclude Segments**:
  - `TOTAL_CALLS > 0`
  - `IS_ONLINE = "offline"`
- **Trigger**: When custom field `TOTAL_CALLS = 0` AND `IS_ONLINE = "online"`
- **Send Time**: 10:00 AM user timezone
- **Sequence**:
  - Day 2: `CA_PRO_nurture-no-calls_01_[LANG]`
  - Day 5: `CA_PRO_nurture-no-calls_02_[LANG]`
  - Day 10: `CA_PRO_nurture-no-calls_03_[LANG]`
- **Stop Condition**: `TOTAL_CALLS > 0` OR `IS_ONLINE = "offline"`

---

### Type 3: Nurture Login Clients (9 autoresponders)
**Purpose**: Encourage clients to make their first login

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture Login Client [LANG]`
- **Description**: "Encourage clients to make their first login - [Language]"
- **Include Segments**:
  - `clients_never_logged`
  - `language_[lang]`
- **Exclude Segments**:
  - `ACTIVITY_STATUS = "active"`
  - `LAST_LOGIN != null`
- **Trigger**: After subscribe
- **Send Time**: 09:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_CLI_nurture-login_01_[LANG]`
  - Day 3: `CA_CLI_nurture-login_02_[LANG]`
  - Day 7: `CA_CLI_nurture-login_03_[LANG]`
  - Day 14: `CA_CLI_nurture-login_04_[LANG]`
- **Stop Condition**: `ACTIVITY_STATUS = "active"` OR `LAST_LOGIN != null`

---

### Type 4: Nurture Login Providers (9 autoresponders)
**Purpose**: Encourage providers to make their first login

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture Login Provider [LANG]`
- **Description**: "Encourage providers to make their first login - [Language]"
- **Include Segments**:
  - `providers_never_logged`
  - `language_[lang]`
- **Exclude Segments**:
  - `ACTIVITY_STATUS = "active"`
  - `LAST_LOGIN != null`
- **Trigger**: After subscribe
- **Send Time**: 09:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_PRO_nurture-login_01_[LANG]`
  - Day 3: `CA_PRO_nurture-login_02_[LANG]`
  - Day 7: `CA_PRO_nurture-login_03_[LANG]`
  - Day 14: `CA_PRO_nurture-login_04_[LANG]`
- **Stop Condition**: `ACTIVITY_STATUS = "active"` OR `LAST_LOGIN != null`

---

### Type 5: Nurture KYC (9 autoresponders)
**Purpose**: Help providers complete KYC verification

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture KYC [LANG]`
- **Description**: "Help providers complete KYC verification - [Language]"
- **Include Segments**:
  - `all_providers`
  - `language_[lang]`
- **Exclude Segments**:
  - `KYC_STATUS = "kyc_verified"`
- **Additional Filter**:
  - `KYC_STATUS IN ("kyc_pending", "kyc_submitted", "kyc_rejected")`
- **Trigger**: When custom field `KYC_STATUS` changes
- **Send Time**: 10:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_PRO_nurture-kyc_01_[LANG]`
  - Day 3: `CA_PRO_nurture-kyc_02_[LANG]`
  - Day 7: `CA_PRO_nurture-kyc_03_[LANG]`
  - Day 14: `CA_PRO_nurture-kyc_04_[LANG]`
- **Stop Condition**: `KYC_STATUS = "kyc_verified"`

---

### Type 6: Nurture Offline (9 autoresponders)
**Purpose**: Remind providers to go online

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture Offline [LANG]`
- **Description**: "Remind providers to go online - [Language]"
- **Include Segments**:
  - `providers_offline`
  - `language_[lang]`
- **Exclude Segments**:
  - `IS_ONLINE = "online"`
- **Trigger**: When custom field `IS_ONLINE = "offline"`
- **Send Time**: 09:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_PRO_nurture-offline_01_[LANG]`
  - Day 3: `CA_PRO_nurture-offline_02_[LANG]`
  - Day 5: `CA_PRO_nurture-offline_03_[LANG]`
  - Day 7: `CA_PRO_nurture-offline_04_[LANG]`
  - Day 10: `CA_PRO_nurture-offline_05_[LANG]`
- **Stop Condition**: `IS_ONLINE = "online"`

---

### Type 7: Nurture PayPal (9 autoresponders)
**Purpose**: Help providers configure PayPal

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture PayPal [LANG]`
- **Description**: "Help providers configure PayPal - [Language]"
- **Include Segments**:
  - `providers_paypal_pending`
  - `language_[lang]`
- **Exclude Segments**:
  - `PAYPAL_STATUS = "paypal_ok"`
- **Trigger**: When `PAYMENT_TYPE = "paypal"` AND `PAYPAL_STATUS = "paypal_pending"`
- **Send Time**: 10:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_PRO_nurture-paypal_01_[LANG]`
  - Day 4: `CA_PRO_nurture-paypal_02_[LANG]`
  - Day 8: `CA_PRO_nurture-paypal_03_[LANG]`
- **Stop Condition**: `PAYPAL_STATUS = "paypal_ok"`

---

### Type 8: Nurture Action (9 autoresponders)
**Purpose**: Encourage clients to take their first action

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Nurture Action [LANG]`
- **Description**: "Encourage clients to take their first action - [Language]"
- **Include Segments**:
  - `clients_no_action`
  - `language_[lang]`
- **Exclude Segments**:
  - `TOTAL_CALLS > 0`
- **Trigger**: When custom field `TOTAL_CALLS = 0`
- **Send Time**: 09:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_CLI_nurture-action_01_[LANG]`
  - Day 3: `CA_CLI_nurture-action_02_[LANG]`
  - Day 7: `CA_CLI_nurture-action_03_[LANG]`
  - Day 14: `CA_CLI_nurture-action_04_[LANG]`
- **Stop Condition**: `TOTAL_CALLS > 0`

---

### Type 9: Reactivation Clients (9 autoresponders)
**Purpose**: Re-engage inactive clients

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Reactivation Client [LANG]`
- **Description**: "Re-engage inactive clients - [Language]"
- **Include Segments**:
  - `clients_inactive`
  - `language_[lang]`
- **Exclude Segments**:
  - `LAST_ACTIVITY != "inactive_30_days"`
  - `ACTIVITY_STATUS = "active"`
- **Trigger**: When `ACTIVITY_STATUS = "inactive"`
- **Send Time**: 09:00 AM user timezone
- **RTL Support**: Enabled for Arabic (AR)
- **Sequence**:
  - Day 1: `CA_CLI_nurture-inactive_01_[LANG]`
  - Day 3: `CA_CLI_nurture-inactive_02_[LANG]`
  - Day 7: `CA_CLI_nurture-inactive_03_[LANG]`
  - Day 14: `CA_CLI_nurture-inactive_04_[LANG]`
  - Day 21: `CA_CLI_nurture-inactive_05_[LANG]`
- **Stop Condition**: `LAST_ACTIVITY != "inactive_30_days"` OR `ACTIVITY_STATUS = "active"`

---

### Type 10: Reactivation Providers (9 autoresponders)
**Purpose**: Re-engage inactive providers

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Reactivation Provider [LANG]`
- **Description**: "Re-engage inactive providers - [Language]"
- **Include Segments**:
  - `providers_inactive`
  - `language_[lang]`
- **Exclude Segments**:
  - `LAST_ACTIVITY != "inactive_30_days"`
  - `ACTIVITY_STATUS = "active"`
- **Trigger**: When `ACTIVITY_STATUS = "inactive"`
- **Send Time**: 10:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_PRO_nurture-inactive-p_01_[LANG]`
  - Day 5: `CA_PRO_nurture-inactive-p_02_[LANG]`
  - Day 10: `CA_PRO_nurture-inactive-p_03_[LANG]`
- **Stop Condition**: `LAST_ACTIVITY != "inactive_30_days"` OR `ACTIVITY_STATUS = "active"`

---

### Type 11: Request Review (9 autoresponders)
**Purpose**: Request reviews from clients who completed calls

**Languages**: FR, EN, DE, ES, PT, RU, ZH, AR, HI

**Configuration per language**:
- **Name**: `Request Review [LANG]`
- **Description**: "Request reviews from clients who completed calls - [Language]"
- **Include Segments**:
  - `clients_completed_call` (clients who have completed a call but haven't left a review)
  - `language_[lang]`
- **Exclude Segments**:
  - `HAS_LEFT_REVIEW = true`
- **Trigger**: When custom field `TOTAL_CALLS > 0` AND `HAS_LEFT_REVIEW != true`
- **Send Time**: 10:00 AM user timezone
- **Sequence**:
  - Day 1: `CA_CLI_request-review_01_[LANG]`
  - Day 3: `CA_CLI_request-review_02_[LANG]`
  - Day 7: `CA_CLI_request-review_03_[LANG]`
  - Day 14: `CA_CLI_request-review_04_[LANG]`
- **Stop Condition**: `HAS_LEFT_REVIEW = true`

---

## Configuration Steps

### Step 1: Access MailWizz Autoresponders

1. Log in to MailWizz admin panel
2. Navigate to: **Lists** → **SOS-Expat** (List UID: `yl089ehqpgb96`)
3. Click on **Autoresponders**
4. Click **Create new autoresponder**

### Step 2: Basic Configuration

For each autoresponder:

1. **Name**: Use format `[TYPE] [LANG]` (e.g., "Nurture Profile EN")
2. **Description**: Brief description of purpose
3. **List**: Select "SOS-Expat" (UID: `yl089ehqpgb96`)
4. **Status**: Active

### Step 3: Segment Configuration

1. **Include Segments**: Add required segments (e.g., `profile_incomplete` + `language_en`)
2. **Exclude Segments**: Add stop condition segments
3. **Segment Logic**: Use "AND" for include segments, "OR" for exclude segments

### Step 4: Trigger Configuration

1. **Trigger Type**: 
   - "After subscribe" for welcome sequences
   - "When custom field changes" for conditional sequences
2. **Custom Field**: Select relevant field (e.g., `TOTAL_CALLS`, `IS_ONLINE`)
3. **Condition**: Set condition (e.g., `= 0`, `= "offline"`)

### Step 5: Email Sequence

1. Click **Add email** for each email in the sequence
2. Select template from dropdown (e.g., `CA_PRO_nurture-profile_01_EN`)
3. Set delay (in days) from previous email
4. Configure send time (e.g., 09:00 AM)

### Step 6: Stop Conditions

1. Navigate to **Stop Conditions** tab
2. Add conditions that should stop the autoresponder:
   - Custom field conditions (e.g., `PROFILE_STATUS = "profile_complete"`)
   - Segment exclusions (already configured in Step 3)

### Step 7: Rate Limiting

1. Navigate to **Settings** tab
2. Configure:
   - **Max emails per subscriber per day**: 5
   - **Min hours between emails**: 4
   - **Quiet hours**: 22:00 - 08:00 (user timezone)

### Step 8: Save and Activate

1. Review all settings
2. Click **Save**
3. Activate the autoresponder

---

## Segment Combinations

### Quick Reference

| Autoresponder Type | Include Segments | Exclude Segments |
|-------------------|------------------|------------------|
| Nurture Profile | `profile_incomplete` + `language_[lang]` | `PROFILE_STATUS = "profile_complete"` |
| Nurture No Calls | `providers_no_calls` + `language_[lang]` | `TOTAL_CALLS > 0`, `IS_ONLINE = "offline"` |
| Nurture Login Clients | `clients_never_logged` + `language_[lang]` | `ACTIVITY_STATUS = "active"` |
| Nurture Login Providers | `providers_never_logged` + `language_[lang]` | `ACTIVITY_STATUS = "active"` |
| Nurture KYC | `all_providers` + `language_[lang]` | `KYC_STATUS = "kyc_verified"` |
| Nurture Offline | `providers_offline` + `language_[lang]` | `IS_ONLINE = "online"` |
| Nurture PayPal | `providers_paypal_pending` + `language_[lang]` | `PAYPAL_STATUS = "paypal_ok"` |
| Nurture Action | `clients_no_action` + `language_[lang]` | `TOTAL_CALLS > 0` |
| Reactivation Clients | `clients_inactive` + `language_[lang]` | `LAST_ACTIVITY != "inactive_30_days"` |
| Reactivation Providers | `providers_inactive` + `language_[lang]` | `LAST_ACTIVITY != "inactive_30_days"` |
| Request Review | `clients_completed_call` + `language_[lang]` | `HAS_LEFT_REVIEW = true` |

---

## Stop Conditions

Stop conditions are automatically handled by Cloud Functions that update MailWizz custom fields. When a stop condition is met:

1. Cloud Function updates the relevant custom field in MailWizz
2. MailWizz automatically removes subscriber from autoresponder
3. No further emails are sent

### Stop Condition Mapping

| Stop Condition | Custom Field Update | Triggered By |
|---------------|-------------------|--------------|
| Profile completed | `PROFILE_STATUS = "profile_complete"` | `handleProfileCompleted` |
| User became active | `ACTIVITY_STATUS = "active"` | `handleUserLogin` |
| First call completed | `TOTAL_CALLS > 0` | `handleCallCompleted` |
| User went online | `IS_ONLINE = "online"` | `handleProviderOnlineStatus` |
| KYC verified | `KYC_STATUS = "kyc_verified"` | `handleKYCVerification` |
| PayPal configured | `PAYPAL_STATUS = "paypal_ok"` | `handlePayPalConfiguration` |
| First login | `LAST_LOGIN != null` | `handleUserLogin` |

---

## Template Sequences

### Template Naming Convention

Format: `[TYPE]_[AUDIENCE]_[NAME]_[LANG]`

- **TYPE**: `CA` (Campaign/Autoresponder), `TR` (Transactional), `NL` (Newsletter)
- **AUDIENCE**: `CLI` (Client), `PRO` (Provider)
- **NAME**: Descriptive name (e.g., `nurture-profile`, `nurture-login`)
- **LANG**: Language code in UPPERCASE (FR, EN, DE, ES, PT, RU, ZH, AR, HI)

### Sequence Examples

**Nurture Profile (4 emails)**:
- `CA_PRO_nurture-profile_01_EN`
- `CA_PRO_nurture-profile_02_EN`
- `CA_PRO_nurture-profile_03_EN`
- `CA_PRO_nurture-profile_04_EN`

**Nurture No Calls (3 emails)**:
- `CA_PRO_nurture-no-calls_01_EN`
- `CA_PRO_nurture-no-calls_02_EN`
- `CA_PRO_nurture-no-calls_03_EN`

**Reactivation Clients (5 emails)**:
- `CA_CLI_nurture-inactive_01_EN`
- `CA_CLI_nurture-inactive_02_EN`
- `CA_CLI_nurture-inactive_03_EN`
- `CA_CLI_nurture-inactive_04_EN`
- `CA_CLI_nurture-inactive_05_EN`

---

## Rate Limiting & Quiet Hours

### Global Settings (MailWizz → Settings → Delivery Servers)

- **Emails per hour**: 1,000
- **Emails per day**: 10,000
- **Pause between emails**: 3 seconds

### Per-Autoresponder Settings

- **Max emails per subscriber per day**: 5
- **Min hours between emails**: 4
- **Quiet hours**: 22:00 - 08:00 (user timezone)
- **Weekend throttling**: 50% reduction on Saturday/Sunday

### Implementation

These settings are configured in MailWizz UI:
1. Navigate to **Lists** → **SOS-Expat** → **Settings**
2. Configure rate limiting
3. Set quiet hours
4. Enable weekend throttling

---

## Verification Checklist

Use this checklist to verify all 99 autoresponders are configured correctly:

### For Each Autoresponder (99 total):

- [ ] Name follows convention: `[TYPE] [LANG]`
- [ ] Correct include segments (2 segments: base + language)
- [ ] Correct exclude segments (stop conditions)
- [ ] Trigger configured correctly
- [ ] All templates in sequence exist and are correct
- [ ] Delay days are correct
- [ ] Send time is set (09:00 or 10:00 AM)
- [ ] Stop conditions are configured
- [ ] Rate limiting is set (5 emails/day, 4 hours between)
- [ ] Quiet hours are enabled (22:00 - 08:00)
- [ ] Status is Active

### By Type (11 types):

- [ ] Type 1: Nurture Profile (9 languages)
- [ ] Type 2: Nurture No Calls (9 languages)
- [ ] Type 3: Nurture Login Clients (9 languages)
- [ ] Type 4: Nurture Login Providers (9 languages)
- [ ] Type 5: Nurture KYC (9 languages)
- [ ] Type 6: Nurture Offline (9 languages)
- [ ] Type 7: Nurture PayPal (9 languages)
- [ ] Type 8: Nurture Action (9 languages)
- [ ] Type 9: Reactivation Clients (9 languages)
- [ ] Type 10: Reactivation Providers (9 languages)
- [ ] Type 11: Request Review (9 languages)

### By Language (9 languages):

- [ ] French (FR) - 11 autoresponders
- [ ] English (EN) - 11 autoresponders
- [ ] German (DE) - 11 autoresponders
- [ ] Spanish (ES) - 11 autoresponders
- [ ] Portuguese (PT) - 11 autoresponders
- [ ] Russian (RU) - 11 autoresponders
- [ ] Chinese (ZH) - 11 autoresponders
- [ ] Arabic (AR) - 11 autoresponders (RTL enabled)
- [ ] Hindi (HI) - 11 autoresponders

**Total**: 99 autoresponders (11 × 9)

---

## Troubleshooting

### Autoresponder Not Triggering

1. Check subscriber is in correct segments
2. Verify trigger conditions are met
3. Check if subscriber is excluded by stop conditions
4. Verify autoresponder is Active
5. Check rate limiting hasn't been exceeded

### Emails Not Sending

1. Verify templates exist and are published
2. Check delivery server is active
3. Verify subscriber email is valid
4. Check bounce/complaint status
5. Review MailWizz logs

### Stop Conditions Not Working

1. Verify Cloud Functions are updating custom fields
2. Check custom field values in MailWizz
3. Verify exclude segments are configured correctly
4. Check MailWizz logs for errors

---

## Support

For issues or questions:
- Review MailWizz documentation
- Check Cloud Functions logs
- Verify Firestore user data
- Contact development team

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Complete

