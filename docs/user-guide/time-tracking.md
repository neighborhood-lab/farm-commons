# Time Tracking Guide

This guide covers how to track work hours using clock in/out functionality, verify time entries, and manage payroll data.

---

## Table of Contents

- [Understanding Time Tracking](#understanding-time-tracking)
- [Clocking In](#clocking-in)
- [Clocking Out](#clocking-out)
- [Viewing Time Entries](#viewing-time-entries)
- [Verifying Time Entries](#verifying-time-entries)
- [Editing Time Entries](#editing-time-entries)
- [Breaks and Meal Periods](#breaks-and-meal-periods)
- [Common Workflows](#common-workflows)
- [Compliance and Reporting](#compliance-and-reporting)

---

## Understanding Time Tracking

### What is Time Tracking?

Time tracking in Farm Commons records the **actual hours worked** by each worker. It's separate from schedules:

- **Schedules** = Planned work (what you expect to happen)
- **Time Entries** = Actual work (what really happened)

### Why Track Time?

**For Farm Managers:**
- Accurate payroll processing
- Labor cost tracking
- Compliance with labor laws
- Productivity analysis
- Historical labor data

**For Workers:**
- Fair wage payment
- Transparent hours tracking
- Proof of work for benefits
- Clear record of time worked

**For Legal Compliance:**
- Wage and hour law requirements
- Overtime calculation
- Break period documentation
- Audit trail for inspections

---

## Clocking In

### How to Clock In

**For Workers:**

1. Log in to Farm Commons
2. Go to **"Time Tracking"** page
3. Click the **"Clock In"** button
4. Confirm the time is correct
5. Click **"Start Work"**

**Alternative:** Managers can clock in workers manually if needed.

### What Happens When You Clock In

- **Timestamp recorded** - Exact time you clocked in
- **Status changes** - You're marked as "Currently Working"
- **Timer starts** - Shows elapsed time
- **Dashboard updates** - You appear in "Active Workers" list

### Clock In Details

**Worker Selection** (Manager view):
- If you're a Manager, select which worker is clocking in
- Workers automatically clock in under their own account

**Location** (coming in Phase 2):
- GPS coordinates can be captured
- Helps verify workers are on-site

**Notes:**
- Add optional note at clock in (e.g., "Starting tomato harvest")
- Helps with task tracking

---

## Clocking Out

### How to Clock Out

1. Go to **"Time Tracking"** page
2. You'll see your active time entry with elapsed time
3. Click the **"Clock Out"** button
4. Verify the hours are correct
5. Optionally add notes about work completed
6. Click **"Submit"**

### What Happens When You Clock Out

- **End timestamp recorded** - Exact time you clocked out
- **Total hours calculated** - Automatically computed
- **Status changes** - Marked as "Pending Verification"
- **Available for payroll** - Entry appears in manager's verification queue

### Clock Out Details

**Break Time:**
- If you took breaks, enter total break time
- This is deducted from total hours worked
- See [Breaks and Meal Periods](#breaks-and-meal-periods) section

**Work Summary:**
- Add notes about what you accomplished
- Helps managers verify time
- Useful for tracking productivity

**Task Assignment:**
- Link time entry to a schedule (if exists)
- Or add task description manually

---

## Viewing Time Entries

### Time Tracking Page

The Time Tracking page shows:

**For Workers:**
- Your current active entry (if clocked in)
- Recent time entries (past 30 days)
- Total hours this week/month
- Pay period summary

**For Managers:**
- All workers' time entries
- Filter by worker, date, status
- Verification queue
- Payroll reports

### Time Entry Information

Each time entry displays:

- **Worker name**
- **Date**
- **Clock in time**
- **Clock out time**
- **Total hours** (minus breaks)
- **Break time**
- **Task/Schedule** (if linked)
- **Status** (Active, Pending, Verified)
- **Notes**

### Filtering Time Entries

**By Date:**
- Today
- This Week
- This Pay Period (bi-weekly or monthly)
- Custom date range

**By Worker:**
- Select from dropdown
- Search by name

**By Status:**
- Active (currently clocked in)
- Pending Verification
- Verified
- All

---

## Verifying Time Entries

### Who Can Verify?

**Only Managers and Admins** can verify time entries.

### Why Verify Time?

Verification ensures:
- Hours are accurate
- Worker actually worked those hours
- Break times are correct
- No data entry errors
- Compliance with labor laws

**Verified time entries** are considered final and ready for payroll.

### How to Verify Time Entries

1. Go to **"Time Tracking"** page
2. Filter by **"Pending Verification"**
3. Review each time entry:
   - Check clock in/out times are reasonable
   - Verify task was completed
   - Confirm break time is correct
4. Click **"Verify"** button
5. Time entry status changes to "Verified"

### Verification Checklist

Before verifying, check:

- ✅ **Times are accurate** - Not obviously wrong (e.g., 24 hours straight)
- ✅ **Worker was on site** - Confirm they actually worked
- ✅ **Breaks are logged** - Meal periods properly recorded
- ✅ **Task makes sense** - Linked to appropriate schedule or task
- ✅ **Notes are clear** - Any issues or concerns documented

### Bulk Verification

For multiple entries on the same day:

1. Select multiple time entries (checkbox)
2. Click **"Verify Selected"**
3. Confirm bulk verification
4. All selected entries are verified at once

**Use carefully:** Only bulk verify if you're confident all entries are accurate.

---

## Editing Time Entries

### When to Edit

Edit a time entry when:
- Worker forgot to clock out
- Clock in time is incorrect
- Break time was not recorded
- Wrong worker was selected
- Data entry error

### Who Can Edit?

- **Workers** can edit their own **pending** time entries (before verification)
- **Managers** can edit any time entry (even after verification)

### How to Edit

1. Go to **"Time Tracking"** page
2. Find the time entry to edit
3. Click **"Edit"** button
4. Update the information:
   - Clock in time
   - Clock out time
   - Break duration
   - Task/notes
5. Add a note explaining the change
6. Click **"Save Changes"**

### Edit Restrictions

**Best practices:**
- Only edit when necessary
- Always document why you edited
- Get worker confirmation for changes
- Don't edit verified entries unless absolutely necessary

**Audit trail:** All edits are logged with timestamp and user who made the change.

---

## Breaks and Meal Periods

### Why Track Breaks?

**Legal compliance:**
- Many states require meal breaks
- Unpaid vs. paid break regulations
- Overtime calculation accuracy
- Labor law audit protection

### Types of Breaks

**Meal Period (Unpaid):**
- Usually 30-60 minutes
- Completely off duty
- Deducted from total hours
- Required after certain hours worked (varies by state)

**Rest Break (Paid):**
- Usually 10-15 minutes
- Not deducted from hours
- Required per hours worked (varies by state)
- Often not tracked separately

### Recording Breaks

**Option 1: At Clock Out**
1. Clock out as normal
2. Enter total break time in minutes
3. System automatically deducts from total hours

**Option 2: Separate Clock Events** (coming in Phase 2)
1. Clock out for break start
2. Clock in when break ends
3. System tracks break automatically

### Break Time Calculation

Example:
- Clock in: 7:00 AM
- Clock out: 3:00 PM
- Total time: 8 hours
- Break time: 30 minutes
- **Paid hours: 7.5 hours**

Farm Commons automatically calculates: Total hours - Break time = Paid hours

---

## Common Workflows

### Standard Work Day

**Worker Workflow:**

1. **Morning:** Arrive at farm, clock in (7:00 AM)
2. **Work:** Complete assigned tasks
3. **Lunch:** Take meal break (12:00 PM - 12:30 PM)
4. **Afternoon:** Continue work
5. **End of day:** Clock out, enter 30 min break (3:00 PM)
6. **Result:** 7.5 hours paid

**Manager Workflow:**

1. **End of day:** Review pending time entries
2. **Verify:** Cross-check with schedules and observation
3. **Approve:** Click verify for accurate entries
4. **Follow up:** Contact worker if times seem incorrect

---

### Forgot to Clock Out

**Scenario:** Worker goes home without clocking out.

**Solution 1 - Worker fixes it:**
1. Worker logs in remotely (or next day)
2. Edits active time entry
3. Enters correct clock out time
4. Adds note: "Forgot to clock out, left at 3pm"
5. Submits for verification

**Solution 2 - Manager fixes it:**
1. Manager finds active time entry
2. Clicks "Edit"
3. Enters clock out time based on knowledge of when worker left
4. Adds note: "Clocked out by manager - worker left at 3pm"
5. Verifies entry

---

### Forgot to Clock In

**Scenario:** Worker forgets to clock in at start of shift.

**Solution:**
1. Worker clocks in when they remember
2. Immediately clocks out
3. Edits the entry to show correct start time
4. Adds note: "Forgot to clock in, actually started at 7am"
5. Submits for manager verification

**Or Manager creates entry:**
1. Manager goes to Time Tracking
2. Clicks "Add Time Entry"
3. Selects worker, date, times
4. Adds note: "Created by manager - worker forgot to clock in"
5. Marks as verified

---

### Payroll Processing

**Weekly Payroll Scenario:**

1. **Monday morning:** Review all time entries from previous week
2. **Verify all entries:** Ensure all pending entries are verified
3. **Export to CSV:** Download time entries for payroll system
4. **Process payroll:** Import into QuickBooks, Gusto, or manual spreadsheet
5. **Archive:** Keep records for compliance (7 years)

---

### Handling Discrepancies

**Scenario:** Time entry shows 10 hours but worker was only scheduled for 8.

**Steps:**
1. Review the time entry details
2. Check notes for explanation
3. Talk to worker: "I see you worked 10 hours, but schedule was 8. What happened?"
4. Possible reasons:
   - Task took longer than expected (verify and approve)
   - Worker helped with another task (verify and approve)
   - Clock out error (edit to correct time)
5. Document decision in notes
6. Verify entry

**Principle:** Trust but verify. Workers should be paid for actual hours worked, but also check for errors.

---

## Compliance and Reporting

### Labor Law Compliance

Farm Commons helps you comply with:

**Wage and Hour Laws:**
- Accurate time tracking
- Overtime calculation (>40 hours/week)
- Minimum wage verification
- Break period documentation

**Record Keeping:**
- 7-year retention requirement (FLSA)
- Audit-ready reports
- Time stamp accuracy
- Edit audit trail

### Overtime Tracking

**How Farm Commons handles overtime:**

1. **Tracks total hours** per worker per week
2. **Flags overtime** when >40 hours
3. **Separates regular and OT hours** in reports
4. **Calculates OT pay** (1.5x rate)

**Manager responsibilities:**
- Review weekly hours to avoid excessive overtime
- Plan schedules to balance hours
- Approve overtime in advance when possible
- Verify overtime hours are accurate

### Reports

**Available Reports:**

**Weekly Time Summary:**
- Total hours per worker
- Regular vs. overtime hours
- By task or field
- Export to CSV

**Payroll Report:**
- Pay period totals
- Worker wage rates
- Gross pay calculations
- Export for payroll processing

**Compliance Report:**
- Break period compliance
- Overtime analysis
- Missing time entries
- Late verifications

**Labor Cost Report:**
- Labor costs by field
- Labor costs by task
- Cost per unit harvested
- Budget vs. actual

---

## Best Practices

### For Workers

- ✅ **Clock in/out promptly** - At actual start and end times
- ✅ **Record breaks accurately** - Don't claim paid time for unpaid breaks
- ✅ **Add helpful notes** - Describe work completed
- ✅ **Check your time** - Verify hours before submitting
- ✅ **Report errors immediately** - Don't wait until payday

### For Managers

- ✅ **Verify daily** - Don't let entries pile up
- ✅ **Be consistent** - Apply same standards to all workers
- ✅ **Trust but verify** - Give workers benefit of doubt, but check unusual entries
- ✅ **Communicate clearly** - Explain time tracking policies
- ✅ **Document everything** - Add notes to edited or questionable entries
- ✅ **Review weekly totals** - Check for overtime, missing entries

### For Compliance

- ✅ **Keep all records** - 7 years minimum
- ✅ **Document policies** - Written time tracking policy
- ✅ **Train workers** - Everyone understands how to track time
- ✅ **Regular audits** - Monthly review of practices
- ✅ **Fix errors promptly** - Don't let issues linger

---

## Troubleshooting

### Common Issues

**Problem:** Clock out button is grayed out
- **Solution:** You're not clocked in. Click "Clock In" first.

**Problem:** Can't edit time entry
- **Solution:** Time entry is already verified. Contact your manager to edit it.

**Problem:** Hours calculation seems wrong
- **Solution:** Check if break time was deducted. Total hours = Clock out - Clock in - Breaks.

**Problem:** Time entry disappeared
- **Solution:** Check your date filters. It may be outside the selected date range.

**Problem:** Forgot to clock in and out for multiple days
- **Solution:** Contact your manager. They can create time entries manually.

**Problem:** Overtime showing but didn't work >40 hours
- **Solution:** Check if previous pay period hours are included. Farm Commons tracks weekly Sunday-Saturday.

---

## Frequently Asked Questions

**Q: Can I clock in from home?**
- A: Technically yes, but you should only clock in when actually working. GPS verification coming in Phase 2.

**Q: What if I work split shifts (morning and evening)?**
- A: Create two separate time entries - one for each shift.

**Q: How are breaks different from meal periods?**
- A: Short breaks (<20 min) are typically paid and don't need to be tracked. Meal periods (30+ min) are unpaid and must be recorded.

**Q: Can managers see everyone's time entries?**
- A: Yes. Managers and Admins can see all workers' time entries for verification and reporting.

**Q: How long are time entry records kept?**
- A: Farm Commons keeps all time entries indefinitely. You should retain records for at least 7 years per FLSA.

**Q: What happens if I clock in on the wrong day?**
- A: Edit the time entry and change the date. Add a note explaining the correction.

**Q: Can I export time entries to Excel?**
- A: Yes. Use the "Export to CSV" button on the Time Tracking page. Open CSV files in Excel.

---

## Integration with Other Features

### Time Entries and Schedules

- **Schedules = Plan** / **Time Entries = Reality**
- Time entries can be linked to schedules
- Comparison helps improve future scheduling
- Variances are normal and expected

### Time Entries and Payroll

- Verified time entries are payroll-ready
- Export to CSV for import into payroll software
- Supports QuickBooks, Gusto, ADP, and others
- Or use for manual payroll calculation

### Time Entries and Reports

- Historical labor data for farm planning
- Cost analysis by crop or field
- Productivity metrics (acres harvested per hour)
- Seasonal labor planning

---

## Next Steps

- **[Worker Management Guide →](worker-management.md)** - Manage your staff directory
- **[Scheduling Guide →](scheduling.md)** - Plan work assignments

---

**Need more help?** Check the [Troubleshooting Guide](troubleshooting.md) or contact your farm administrator.
