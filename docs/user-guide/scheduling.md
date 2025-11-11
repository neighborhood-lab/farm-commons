# Scheduling Guide

This guide covers how to create and manage work schedules, assign workers to tasks and fields, and coordinate daily farm operations.

---

## Table of Contents

- [Understanding Schedules](#understanding-schedules)
- [Viewing Schedules](#viewing-schedules)
- [Creating a Schedule](#creating-a-schedule)
- [Editing Schedules](#editing-schedules)
- [Deleting Schedules](#deleting-schedules)
- [Schedule Status](#schedule-status)
- [Common Workflows](#common-workflows)
- [Best Practices](#best-practices)

---

## Understanding Schedules

### What is a Schedule?

A schedule in Farm Commons represents a **work assignment** for a specific worker on a specific date. Each schedule includes:

- **Worker** - Who is assigned
- **Date** - When the work should be done
- **Start Time** - When to begin
- **End Time** - When to finish (estimated)
- **Task** - What work to do (e.g., "Harvesting", "Irrigation", "Weeding")
- **Field** - Where to work (optional but recommended)
- **Notes** - Additional instructions or details

### Why Use Schedules?

**For Farm Managers:**
- Plan work assignments in advance
- Coordinate multiple workers and tasks
- Track who's working where and when
- Ensure adequate coverage for all tasks
- Create historical record of work assignments

**For Workers:**
- Know what to do and when
- See where they should be working
- Understand task priorities
- Plan their workday
- Get notified of changes

---

## Viewing Schedules

### Accessing the Schedule Page

1. Log in to Farm Commons
2. Click **"Schedule"** in the main navigation
3. You'll see a calendar view of all schedules

### Calendar Views

**Week View** (default)
- Shows 7 days at a time
- Best for detailed planning
- See all workers' schedules side-by-side

**Day View**
- Focus on a single day
- See all schedules for that day
- Best for daily coordination

**Month View** (coming in future phases)
- High-level overview
- See busy vs. slow periods
- Plan seasonal work

### Navigating the Calendar

**Change dates:**
- Click **"Previous Week"** or **"Next Week"** arrows
- Click **"Today"** to return to current week
- Click on a specific date to jump to that day

**Filter schedules:**
- **By worker** - See schedules for specific workers
- **By field** - See all work scheduled for a field
- **By status** - Filter by scheduled, in-progress, or completed

---

## Creating a Schedule

### Prerequisites

**Required permissions:** Manager or Admin role

### Basic Schedule Creation

1. Navigate to the **Schedule** page
2. Click the **"Create Schedule"** button
3. Fill in the schedule form
4. Click **"Save"** to create the schedule

### Schedule Form Fields

**Required Fields:**

**Worker** (required)
- Select worker from dropdown
- Search by name
- Only active workers appear

**Date** (required)
- Click to open date picker
- Select the date for this work assignment
- Can schedule up to 3 months in advance

**Start Time** (required)
- Use time picker or type time
- Format: 12-hour or 24-hour
- Example: 7:00 AM or 19:00

**End Time** (required)
- Estimated completion time
- Used for planning and coverage
- Actual time tracked separately

**Task** (required)
- Select from common tasks dropdown
- Or type custom task
- Examples: Harvesting, Planting, Weeding, Irrigation, Equipment Maintenance

**Optional Fields:**

**Field**
- Select field from dropdown
- Links schedule to specific location
- Useful for GPS tracking and reporting

**Notes**
- Additional instructions
- Special equipment needed
- Contact information
- Weather considerations

---

## Editing Schedules

### When to Edit

Edit a schedule when:
- Worker assignments change
- Task priorities shift
- Weather impacts plans
- Equipment availability changes
- Timing needs adjustment

### How to Edit

1. Go to the **Schedule** page
2. Find the schedule you want to edit
3. Click the schedule or click **"Edit"** button
4. Update the information
5. Click **"Save Changes"**

### Edit Restrictions

**You can edit:**
- Future schedules (not yet started)
- In-progress schedules (before completion)
- Worker assignments
- Times and tasks
- Fields and notes

**You cannot edit:**
- Completed schedules (creates confusion with time entries)
- Schedules for deactivated workers
- Past dates (more than 7 days old)

**Tip:** If you need to change a completed schedule, create a new one and add notes explaining the change.

---

## Deleting Schedules

### When to Delete

Delete a schedule when:
- Worker called in sick
- Weather cancels outdoor work
- Task is no longer needed
- Schedule was created by mistake

### How to Delete

1. Go to the **Schedule** page
2. Find the schedule to delete
3. Click the **"Delete"** button (trash icon)
4. Confirm deletion in the popup
5. Schedule is permanently removed

**Important:** Deleting a schedule is permanent and cannot be undone. If you might need the information later, edit it instead or add a note.

### Deletion Restrictions

**You cannot delete:**
- Schedules with associated time entries
- Schedules that are already in-progress
- Completed schedules

**Instead:** Edit the schedule status to "Cancelled" and add a note explaining why.

---

## Schedule Status

Schedules have different statuses throughout their lifecycle:

### Scheduled (Gray)
- **Meaning:** Future work assignment, not yet started
- **Worker action:** Review assignment, prepare for work
- **Manager action:** Can edit or delete if needed

### In Progress (Blue)
- **Meaning:** Worker has clocked in, currently working
- **Worker action:** Complete the assigned task
- **Manager action:** Monitor progress, adjust if needed

### Completed (Green)
- **Meaning:** Work is done, time entry verified
- **Worker action:** None (archived)
- **Manager action:** Review time entry, verify hours

### Cancelled (Red)
- **Meaning:** Schedule was cancelled or not completed
- **Worker action:** Aware work is not happening
- **Manager action:** Document reason in notes

---

## Common Workflows

### Daily Morning Planning

**Scenario:** It's Monday morning, you need to coordinate 8 workers for the week.

**Steps:**
1. Review the weather forecast
2. Check which fields need work (walk the farm)
3. Create schedules for each worker:
   - Monday-Friday assignments
   - Match workers to appropriate tasks based on skills
   - Assign fields
   - Add notes for special instructions
4. Verify all critical tasks are covered
5. Workers check their schedules when they arrive

**Tip:** Create schedules at least one day in advance so workers can plan accordingly.

---

### Handling Schedule Changes

**Scenario:** Rain forecast means outdoor planting is cancelled, need to reassign workers.

**Steps:**
1. Identify affected schedules (outdoor tasks)
2. Edit each schedule:
   - Change task to indoor work (e.g., equipment maintenance, greenhouse work)
   - Update field assignment if needed
   - Add note: "Moved indoors due to rain"
3. Notify workers of the change
4. Verify everyone has a productive assignment

**Communication tip:** Call or text workers if change is same-day. For next-day changes, they'll see it when they log in.

---

### Worker Call-In Sick

**Scenario:** A worker calls in sick 30 minutes before start time.

**Steps:**
1. Mark their schedule as "Cancelled"
2. Add note: "Worker called in sick"
3. Assess: Can other workers cover the task?
   - If yes: Create new schedule for available worker
   - If no: Reschedule task to another day
4. Update any dependent tasks
5. Document for attendance records

---

### Harvest Rush Coordination

**Scenario:** Tomatoes are ready, need all hands on deck for 3 days.

**Steps:**
1. Identify available workers
2. Create schedules for all workers:
   - Task: "Tomato Harvest"
   - Field: "Field 3 - Tomatoes"
   - Start: 6:00 AM (beat the heat)
   - End: 2:00 PM
   - Notes: "Bring harvest bins, drink plenty of water"
3. Schedule shifts if needed (morning/afternoon crews)
4. Plan for sorting and packing (additional workers)
5. Create schedules for next few days in advance

**Tip:** For harvest rushes, schedule 30% more time than estimated - nature is unpredictable.

---

### Rotating Tasks

**Scenario:** You want to rotate workers through different tasks to build skills.

**Steps:**
1. Identify skills you want workers to develop
2. Create weekly rotation schedule:
   - Week 1: Worker A on planting, Worker B on weeding
   - Week 2: Worker A on weeding, Worker B on planting
3. Create schedules accordingly
4. Add notes about training opportunities
5. Review with workers to ensure they understand

**Benefits:** Cross-trained workers, reduced burnout, better farm flexibility.

---

## Best Practices

### Planning Ahead

- ✅ **Schedule 2-7 days in advance** - Gives workers time to plan
- ✅ **Consider weather** - Check forecast before scheduling outdoor work
- ✅ **Match skills to tasks** - Assign workers to tasks they're qualified for
- ✅ **Avoid overscheduling** - Leave buffer time for unexpected tasks
- ✅ **Plan for breaks** - Include rest time in schedules

### Clear Communication

- ✅ **Use specific task names** - "Harvest tomatoes in Field 3" not just "harvesting"
- ✅ **Add helpful notes** - Equipment needed, where to meet, special instructions
- ✅ **Update schedules promptly** - Don't leave outdated schedules
- ✅ **Notify of changes** - Let workers know ASAP if schedules change
- ✅ **Be realistic about time** - Don't underestimate how long tasks take

### Effective Coordination

- ✅ **Balance workload** - Don't overwork some while others are idle
- ✅ **Use fields wisely** - Don't put too many workers in same small field
- ✅ **Schedule breaks** - Especially during hot weather
- ✅ **Plan equipment needs** - Ensure tools are available for scheduled tasks
- ✅ **Consider worker preferences** - Some workers are better at certain tasks

### Compliance and Safety

- ✅ **Respect labor laws** - Don't schedule more than legal maximum hours
- ✅ **Schedule required breaks** - Check state/federal requirements
- ✅ **Verify certifications** - Only assign tasks to qualified workers
- ✅ **Document hazardous work** - Add safety notes for dangerous tasks
- ✅ **Keep records** - Schedules are part of your compliance documentation

---

## Tips for Different Farm Types

### Small Farms (1-5 workers)

- Keep it simple - don't over-schedule
- Focus on priorities for the day/week
- Be flexible - small teams can adapt quickly
- Use notes heavily for context

### Medium Farms (6-20 workers)

- Schedule weekly in advance
- Use fields to organize work
- Create crew leads (use Manager role)
- Color-code or tag schedules by task type

### Seasonal Operations

- Plan for onboarding rush at season start
- Schedule training time for new workers
- Build in flexibility for weather
- Document lessons learned each season

### Specialty Crops

- Track harvest windows carefully
- Schedule based on crop readiness, not calendar
- Plan for processing/packing time
- Coordinate with market/delivery schedules

---

## Troubleshooting

### Common Issues

**Problem:** Worker not appearing in worker dropdown
- **Solution:** Check that worker is marked "Active". Inactive workers don't appear.

**Problem:** Can't schedule more than a few weeks out
- **Solution:** Farm Commons limits scheduling to 90 days in advance to keep data manageable.

**Problem:** Schedule conflicts (double-booking a worker)
- **Solution:** Farm Commons will warn you if a worker is already scheduled at that time. Review both schedules and adjust.

**Problem:** Schedule disappeared after creating it
- **Solution:** Check filters - you might be filtering by a different date range or worker.

**Problem:** Time entry doesn't match schedule
- **Solution:** This is normal - workers may work different hours than scheduled. Verify the actual time entry.

---

## Frequently Asked Questions

**Q: Can I create recurring schedules (e.g., same schedule every week)?**
- A: Not yet, but this feature is planned for Phase 2. For now, create schedules individually or weekly.

**Q: Can workers see other workers' schedules?**
- A: Workers can only see their own schedules. Managers and Admins can see all schedules.

**Q: What happens if a worker clocks in without a schedule?**
- A: That's fine! Workers can clock in even without a schedule. You can create the schedule later if needed.

**Q: Can I assign multiple workers to the same task?**
- A: Yes, create separate schedules for each worker. They can all work the same field/task.

**Q: How far in advance should I schedule?**
- A: Best practice is 2-7 days in advance. Balance planning ahead with flexibility for weather and changing priorities.

**Q: Can I schedule half-days or specific hours?**
- A: Yes, use the start and end time fields to schedule any duration.

---

## Integration with Other Features

### Schedules and Time Tracking

- Schedules are **planning** - what you intend to happen
- Time entries are **reality** - what actually happened
- They don't have to match exactly
- Use schedules to guide work, time entries to track actual hours

### Schedules and Fields

- Linking schedules to fields helps with:
  - GPS tracking (coming in Phase 2)
  - Field utilization reports
  - Crop-specific labor tracking
  - Coordinating multiple crews

### Schedules and Workers

- Worker skills should match scheduled tasks
- Check certifications before assigning specialized tasks
- Consider worker preferences when possible
- Rotate tasks to build skills and reduce burnout

---

## Next Steps

- **[Time Tracking Guide →](time-tracking.md)** - Learn how to track actual hours worked
- **[Worker Management Guide →](worker-management.md)** - Manage your staff directory

---

**Need more help?** Check the [Troubleshooting Guide](troubleshooting.md) or contact your farm administrator.
