# Autoresponder Segment & Trigger Configuration
## Complete Configuration for All 99 Autoresponders

This document provides the exact segment combinations, segment logic, and trigger configurations for all 99 autoresponders in MailWizz.

---

## Segment Logic Explanation

### Include Segments (AND Logic)
- **Logic**: `AND` - Subscriber must be in ALL included segments
- **Example**: `profile_incomplete` AND `language_en` = Subscriber must be in BOTH segments

### Exclude Segments (OR Logic)
- **Logic**: `OR` - Subscriber is excluded if they match ANY exclude condition
- **Example**: `PROFILE_STATUS = "profile_complete"` = Exclude if this condition is true

### Combined Logic
- Subscriber must match ALL include segments AND NOT match ANY exclude condition

---

## Configuration for Each Autoresponder Type

### TYPE 1: Nurture Profile (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture Profile [LANG]` (e.g., "Nurture Profile EN")

**Include Segments** (AND logic):
- `profile_incomplete`
- `language_[lang]` (e.g., `language_en`, `language_fr`)

**Exclude Segments** (OR logic):
- Custom Field Condition: `PROFILE_STATUS = "profile_complete"`

**Trigger Configuration**:
- **Trigger Type**: `After subscribe`
- **Custom Field**: (not applicable)
- **Condition**: (not applicable)

**Email Sequence**:
- Day 1: `CA_PRO_nurture-profile_01_[LANG]`
- Day 3: `CA_PRO_nurture-profile_02_[LANG]`
- Day 7: `CA_PRO_nurture-profile_03_[LANG]`
- Day 14: `CA_PRO_nurture-profile_04_[LANG]`

**Stop Condition**: `PROFILE_STATUS = "profile_complete"`

---

### TYPE 2: Nurture No Calls (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture No Calls [LANG]`

**Include Segments** (AND logic):
- `providers_no_calls`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `TOTAL_CALLS > 0`
- Custom Field Condition: `IS_ONLINE = "offline"`

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `TOTAL_CALLS`
- **Condition**: `= 0`
- **Additional Condition**: `IS_ONLINE = "online"` (both must be true)

**Email Sequence**:
- Day 2: `CA_PRO_nurture-no-calls_01_[LANG]`
- Day 5: `CA_PRO_nurture-no-calls_02_[LANG]`
- Day 10: `CA_PRO_nurture-no-calls_03_[LANG]`

**Stop Condition**: `TOTAL_CALLS > 0` OR `IS_ONLINE = "offline"`

---

### TYPE 3: Nurture Login Clients (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture Login Client [LANG]`

**Include Segments** (AND logic):
- `clients_never_logged`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `ACTIVITY_STATUS = "active"`
- Custom Field Condition: `LAST_LOGIN != null` (or `LAST_LOGIN` is not empty)

**Trigger Configuration**:
- **Trigger Type**: `After subscribe`
- **Custom Field**: (not applicable)
- **Condition**: (not applicable)

**Email Sequence**:
- Day 1: `CA_CLI_nurture-login_01_[LANG]`
- Day 3: `CA_CLI_nurture-login_02_[LANG]`
- Day 7: `CA_CLI_nurture-login_03_[LANG]`
- Day 14: `CA_CLI_nurture-login_04_[LANG]`

**Stop Condition**: `ACTIVITY_STATUS = "active"` OR `LAST_LOGIN != null`

---

### TYPE 4: Nurture Login Providers (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture Login Provider [LANG]`

**Include Segments** (AND logic):
- `providers_never_logged`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `ACTIVITY_STATUS = "active"`
- Custom Field Condition: `LAST_LOGIN != null`

**Trigger Configuration**:
- **Trigger Type**: `After subscribe`
- **Custom Field**: (not applicable)
- **Condition**: (not applicable)

**Email Sequence**:
- Day 1: `CA_PRO_nurture-login_01_[LANG]`
- Day 3: `CA_PRO_nurture-login_02_[LANG]`
- Day 7: `CA_PRO_nurture-login_03_[LANG]`
- Day 14: `CA_PRO_nurture-login_04_[LANG]`

**Stop Condition**: `ACTIVITY_STATUS = "active"` OR `LAST_LOGIN != null`

---

### TYPE 5: Nurture KYC (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture KYC [LANG]`

**Include Segments** (AND logic):
- `all_providers`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `KYC_STATUS = "kyc_verified"`

**Additional Filter** (in Include Segments):
- Custom Field Condition: `KYC_STATUS IN ("kyc_pending", "kyc_submitted", "kyc_rejected")`

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `KYC_STATUS`
- **Condition**: `IN ("kyc_pending", "kyc_submitted", "kyc_rejected")`

**Email Sequence**:
- Day 1: `CA_PRO_nurture-kyc_01_[LANG]`
- Day 3: `CA_PRO_nurture-kyc_02_[LANG]`
- Day 7: `CA_PRO_nurture-kyc_03_[LANG]`
- Day 14: `CA_PRO_nurture-kyc_04_[LANG]`

**Stop Condition**: `KYC_STATUS = "kyc_verified"`

---

### TYPE 6: Nurture Offline (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture Offline [LANG]`

**Include Segments** (AND logic):
- `providers_offline`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `IS_ONLINE = "online"`

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `IS_ONLINE`
- **Condition**: `= "offline"`

**Email Sequence**:
- Day 1: `CA_PRO_nurture-offline_01_[LANG]`
- Day 3: `CA_PRO_nurture-offline_02_[LANG]`
- Day 5: `CA_PRO_nurture-offline_03_[LANG]`
- Day 7: `CA_PRO_nurture-offline_04_[LANG]`
- Day 10: `CA_PRO_nurture-offline_05_[LANG]`

**Stop Condition**: `IS_ONLINE = "online"`

---

### TYPE 7: Nurture PayPal (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture PayPal [LANG]`

**Include Segments** (AND logic):
- `providers_paypal_pending`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `PAYPAL_STATUS = "paypal_ok"`

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `PAYPAL_STATUS`
- **Condition**: `= "paypal_pending"`
- **Additional Condition**: `PAYMENT_TYPE = "paypal"` (both must be true)

**Email Sequence**:
- Day 1: `CA_PRO_nurture-paypal_01_[LANG]`
- Day 4: `CA_PRO_nurture-paypal_02_[LANG]`
- Day 8: `CA_PRO_nurture-paypal_03_[LANG]`

**Stop Condition**: `PAYPAL_STATUS = "paypal_ok"`

---

### TYPE 8: Nurture Action (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Nurture Action [LANG]`

**Include Segments** (AND logic):
- `clients_no_action`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `TOTAL_CALLS > 0`

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `TOTAL_CALLS`
- **Condition**: `= 0`

**Email Sequence**:
- Day 1: `CA_CLI_nurture-action_01_[LANG]`
- Day 3: `CA_CLI_nurture-action_02_[LANG]`
- Day 7: `CA_CLI_nurture-action_03_[LANG]`
- Day 14: `CA_CLI_nurture-action_04_[LANG]`

**Stop Condition**: `TOTAL_CALLS > 0`

---

### TYPE 9: Reactivation Clients (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Reactivation Client [LANG]`

**Include Segments** (AND logic):
- `clients_inactive`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `LAST_ACTIVITY != "inactive_30_days"`
- Custom Field Condition: `ACTIVITY_STATUS = "active"`

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `ACTIVITY_STATUS`
- **Condition**: `= "inactive"`

**Email Sequence**:
- Day 1: `CA_CLI_nurture-inactive_01_[LANG]`
- Day 3: `CA_CLI_nurture-inactive_02_[LANG]`
- Day 7: `CA_CLI_nurture-inactive_03_[LANG]`
- Day 14: `CA_CLI_nurture-inactive_04_[LANG]`
- Day 21: `CA_CLI_nurture-inactive_05_[LANG]`

**Stop Condition**: `LAST_ACTIVITY != "inactive_30_days"` OR `ACTIVITY_STATUS = "active"`

**Note**: For Arabic (AR), enable RTL support in template settings.

---

### TYPE 10: Reactivation Providers (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Reactivation Provider [LANG]`

**Include Segments** (AND logic):
- `providers_inactive`
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `LAST_ACTIVITY != "inactive_30_days"`
- Custom Field Condition: `ACTIVITY_STATUS = "active"`

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `ACTIVITY_STATUS`
- **Condition**: `= "inactive"`

**Email Sequence**:
- Day 1: `CA_PRO_nurture-inactive-p_01_[LANG]`
- Day 5: `CA_PRO_nurture-inactive-p_02_[LANG]`
- Day 10: `CA_PRO_nurture-inactive-p_03_[LANG]`

**Stop Condition**: `LAST_ACTIVITY != "inactive_30_days"` OR `ACTIVITY_STATUS = "active"`

---

### TYPE 11: Request Review (9 autoresponders)

#### For each language (FR, EN, DE, ES, PT, RU, ZH, AR, HI):

**Autoresponder Name**: `Request Review [LANG]`

**Include Segments** (AND logic):
- `clients_pending_review` (or create segment: clients who completed call but haven't left review)
- `language_[lang]`

**Exclude Segments** (OR logic):
- Custom Field Condition: `HAS_LEFT_REVIEW = true` (or `HAS_LEFT_REVIEW = "true"`)

**Trigger Configuration**:
- **Trigger Type**: `When custom field changes`
- **Custom Field**: `TOTAL_CALLS`
- **Condition**: `> 0`
- **Additional Condition**: `HAS_LEFT_REVIEW != true` (both must be true)

**Email Sequence**:
- Day 1: `CA_CLI_request-review_01_[LANG]`
- Day 3: `CA_CLI_request-review_02_[LANG]`
- Day 7: `CA_CLI_request-review_03_[LANG]`
- Day 14: `CA_CLI_request-review_04_[LANG]`

**Stop Condition**: `HAS_LEFT_REVIEW = true`

**Note**: You may need to create a segment `clients_completed_call` that includes clients with `TOTAL_CALLS > 0` AND `HAS_LEFT_REVIEW != true`.

---

## Quick Reference Table

| Type | Include Segments (AND) | Exclude Conditions (OR) | Trigger Type | Trigger Field | Trigger Condition |
|------|----------------------|------------------------|--------------|---------------|-------------------|
| Nurture Profile | `profile_incomplete` + `language_[lang]` | `PROFILE_STATUS = "profile_complete"` | After subscribe | - | - |
| Nurture No Calls | `providers_no_calls` + `language_[lang]` | `TOTAL_CALLS > 0`, `IS_ONLINE = "offline"` | Custom field change | `TOTAL_CALLS` | `= 0` |
| Nurture Login Clients | `clients_never_logged` + `language_[lang]` | `ACTIVITY_STATUS = "active"`, `LAST_LOGIN != null` | After subscribe | - | - |
| Nurture Login Providers | `providers_never_logged` + `language_[lang]` | `ACTIVITY_STATUS = "active"`, `LAST_LOGIN != null` | After subscribe | - | - |
| Nurture KYC | `all_providers` + `language_[lang]` | `KYC_STATUS = "kyc_verified"` | Custom field change | `KYC_STATUS` | `IN ("kyc_pending", "kyc_submitted", "kyc_rejected")` |
| Nurture Offline | `providers_offline` + `language_[lang]` | `IS_ONLINE = "online"` | Custom field change | `IS_ONLINE` | `= "offline"` |
| Nurture PayPal | `providers_paypal_pending` + `language_[lang]` | `PAYPAL_STATUS = "paypal_ok"` | Custom field change | `PAYPAL_STATUS` | `= "paypal_pending"` |
| Nurture Action | `clients_no_action` + `language_[lang]` | `TOTAL_CALLS > 0` | Custom field change | `TOTAL_CALLS` | `= 0` |
| Reactivation Clients | `clients_inactive` + `language_[lang]` | `LAST_ACTIVITY != "inactive_30_days"`, `ACTIVITY_STATUS = "active"` | Custom field change | `ACTIVITY_STATUS` | `= "inactive"` |
| Reactivation Providers | `providers_inactive` + `language_[lang]` | `LAST_ACTIVITY != "inactive_30_days"`, `ACTIVITY_STATUS = "active"` | Custom field change | `ACTIVITY_STATUS` | `= "inactive"` |
| Request Review | `clients_pending_review` + `language_[lang]` | `HAS_LEFT_REVIEW = true` | Custom field change | `TOTAL_CALLS` | `> 0` |

---

## MailWizz Configuration Steps

### Step 1: Create Autoresponder

1. Navigate to: **Lists** → **SOS-Expat** → **Autoresponders** → **Create new**
2. Enter name: `[TYPE] [LANG]` (e.g., "Nurture Profile EN")

### Step 2: Configure Segments

1. **Include Segments Tab**:
   - Click "Add segment"
   - Select first segment (e.g., `profile_incomplete`)
   - Click "Add segment" again
   - Select second segment (e.g., `language_en`)
   - **Segment Logic**: Select "AND" (subscriber must be in ALL segments)

2. **Exclude Segments Tab**:
   - Click "Add condition"
   - Select "Custom Field"
   - Choose field (e.g., `PROFILE_STATUS`)
   - Select operator (e.g., `=`)
   - Enter value (e.g., `profile_complete`)
   - **Logic**: "OR" (exclude if ANY condition matches)

### Step 3: Configure Trigger

1. **Trigger Type**:
   - Select "After subscribe" OR "When custom field changes"

2. **If "When custom field changes"**:
   - **Custom Field**: Select field (e.g., `TOTAL_CALLS`)
   - **Condition**: Select operator (e.g., `=`, `>`, `IN`)
   - **Value**: Enter value (e.g., `0`, `"offline"`, `("kyc_pending", "kyc_submitted")`)

### Step 4: Configure Email Sequence

1. Click "Add email"
2. Select template from dropdown (e.g., `CA_PRO_nurture-profile_01_EN`)
3. Set delay: Number of days from trigger (e.g., `1`, `3`, `7`)
4. Set send time: `09:00` or `10:00` (user timezone)
5. Repeat for each email in sequence

### Step 5: Configure Stop Conditions

1. Navigate to "Stop Conditions" tab
2. Add conditions that should stop the autoresponder:
   - Custom Field: `PROFILE_STATUS`
   - Operator: `=`
   - Value: `profile_complete`
3. These match the exclude segments

### Step 6: Rate Limiting

1. Navigate to "Settings" tab
2. Configure:
   - **Max emails per subscriber per day**: `5`
   - **Min hours between emails**: `4`
   - **Quiet hours**: `22:00 - 08:00` (user timezone)

### Step 7: Save and Activate

1. Review all settings
2. Click "Save"
3. Click "Activate"

---

## Important Notes

### Segment Logic
- **Include segments use AND logic**: Subscriber must be in ALL included segments
- **Exclude conditions use OR logic**: Subscriber is excluded if ANY condition matches
- **Final logic**: `(Include Segment 1 AND Include Segment 2) AND NOT (Exclude Condition 1 OR Exclude Condition 2)`

### Trigger Types
- **After subscribe**: Triggers immediately when subscriber is added to list
- **When custom field changes**: Triggers when specified custom field changes to match condition

### Stop Conditions
- Stop conditions are automatically checked by MailWizz
- When a stop condition is met, subscriber is removed from autoresponder
- Cloud Functions update custom fields, which triggers stop conditions

### Language Segments
- All 9 language segments exist: `language_fr`, `language_en`, `language_de`, `language_es`, `language_pt`, `language_ru`, `language_zh`, `language_ar`, `language_hi`
- Each autoresponder must include the appropriate language segment

---

## Verification

After configuring all 99 autoresponders, run the verification script:

```bash
cd firebase/functions
npx ts-node src/emailMarketing/scripts/verify-autoresponders.ts
```

This will verify:
- All autoresponders exist
- Segments are correctly assigned
- Templates are in sequence
- Stop conditions are configured

---

**Last Updated**: 2024
**Version**: 1.0
**Total Autoresponders**: 99 (11 types × 9 languages)

