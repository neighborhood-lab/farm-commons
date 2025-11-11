# Troubleshooting Guide

This guide helps you solve common issues with Farm Commons and provides solutions for technical problems.

---

## Table of Contents

- [Getting Help](#getting-help)
- [Login and Authentication Issues](#login-and-authentication-issues)
- [Performance Issues](#performance-issues)
- [Data and Display Issues](#data-and-display-issues)
- [Worker Management Issues](#worker-management-issues)
- [Schedule Issues](#schedule-issues)
- [Time Tracking Issues](#time-tracking-issues)
- [Browser and Device Issues](#browser-and-device-issues)
- [Common Error Messages](#common-error-messages)
- [Reporting Bugs](#reporting-bugs)

---

## Getting Help

### Support Channels

**For Users:**
1. **Check this guide first** - Most common issues are covered here
2. **Ask your farm administrator** - They manage your Farm Commons instance
3. **Read the feature guides** - Detailed walkthroughs for each feature
4. **Check GitHub Discussions** - Community Q&A

**For Administrators:**
1. **Review documentation** - Full developer and deployment docs
2. **Check GitHub Issues** - Known bugs and solutions
3. **Submit new issue** - Report bugs with details
4. **Community support** - GitHub Discussions

### Before You Ask for Help

When requesting support, provide:

- **What you were trying to do** - Specific task or action
- **What happened** - The actual result
- **What you expected** - The desired outcome
- **Error messages** - Exact text of any errors
- **Browser and device** - Chrome/Firefox/Safari, phone/tablet/desktop
- **Steps to reproduce** - How to recreate the issue
- **Screenshots** - If applicable

---

## Login and Authentication Issues

### Can't Log In - "Invalid email or password"

**Possible causes:**
- Wrong email address
- Wrong password
- Account doesn't exist
- Account is deactivated

**Solutions:**

1. **Double-check email address**
   - Make sure there are no typos
   - Check for extra spaces before/after
   - Verify caps lock is off

2. **Verify password**
   - Passwords are case-sensitive
   - Check for caps lock
   - Try retyping instead of pasting

3. **Forgot password?**
   - Click "Forgot Password" link (if available)
   - Or contact your farm administrator to reset

4. **Account might be deactivated**
   - Contact your farm administrator
   - They can check your account status

---

### Logged Out Unexpectedly

**Possible causes:**
- Session expired (after 24 hours)
- Logged in from different device
- Browser cleared cookies
- System update

**Solutions:**

1. **Just log in again**
   - This is normal behavior for security
   - Sessions expire after 24 hours of inactivity

2. **Stay logged in**
   - Check "Remember me" box when logging in (if available)
   - Don't clear browser cookies

3. **Multiple devices**
   - You can be logged in from multiple devices
   - But closing browser may log you out

---

### Password Reset Not Working

**Issue:** Didn't receive password reset email

**Solutions:**

1. **Check spam folder**
   - Reset emails sometimes go to spam
   - Look for email from Farm Commons

2. **Wait a few minutes**
   - Email may take 5-10 minutes to arrive

3. **Verify email address**
   - Make sure you entered the correct email
   - Try the exact email you used to sign up

4. **Contact administrator**
   - They can reset your password manually

---

## Performance Issues

### Farm Commons is Slow

**Possible causes:**
- Slow internet connection
- Too many browser tabs open
- Outdated browser
- Server issues

**Solutions:**

1. **Check internet connection**
   - Test internet speed
   - Try loading other websites
   - Move closer to WiFi router

2. **Close unnecessary tabs**
   - Each tab uses memory
   - Close tabs you're not using

3. **Clear browser cache**
   - Chrome: Settings > Privacy > Clear browsing data
   - Firefox: Preferences > Privacy > Clear Data
   - Safari: Preferences > Privacy > Manage Website Data

4. **Try different browser**
   - Switch to Chrome, Firefox, or Safari
   - Update your current browser

5. **Restart browser**
   - Close browser completely
   - Reopen and try again

---

### Pages Won't Load or Show "Loading..."

**Solutions:**

1. **Wait 30 seconds**
   - Sometimes slow connections take time
   - Don't refresh immediately

2. **Refresh the page**
   - Press F5 or Ctrl+R (Windows)
   - Press Cmd+R (Mac)
   - Or click the refresh button

3. **Check internet connection**
   - Make sure you're connected to internet
   - Try loading google.com to verify

4. **Clear cache and hard reload**
   - Chrome/Firefox: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - This forces a complete reload

---

## Data and Display Issues

### Changes Not Saving

**Symptoms:**
- You edit something but it doesn't save
- You see a spinning icon forever
- "Save" button stays grayed out

**Solutions:**

1. **Check for error messages**
   - Look for red error text
   - Read the message for clues

2. **Verify required fields**
   - All required fields must be filled in
   - Look for fields marked with *

3. **Check internet connection**
   - You need internet to save
   - Try saving when connection is stable

4. **Try again**
   - Click Save button again
   - Sometimes requests time out

5. **Refresh and re-enter**
   - Refresh the page
   - Enter changes again
   - Save immediately

---

### Data Missing or Not Showing Up

**Issue:** You added a worker/schedule/time entry but don't see it

**Solutions:**

1. **Check filters**
   - You might be filtering by wrong date
   - Clear all filters and look again

2. **Refresh the page**
   - Press F5 or reload
   - Sometimes the view doesn't update automatically

3. **Check the correct page**
   - Workers are on Workers page
   - Schedules are on Schedule page
   - Time entries are on Time Tracking page

4. **Verify it was saved**
   - Look for success message after saving
   - If no message, it might not have saved

---

### Wrong Time Zone

**Issue:** Times are showing in the wrong time zone

**Solutions:**

1. **Check device time zone**
   - Farm Commons uses your device's time zone
   - Verify your computer/phone time zone is correct

2. **Check browser settings**
   - Some browsers override time zone
   - Clear cache and try again

3. **Manual adjustment**
   - If stuck, mentally adjust times
   - Report to administrator to fix

---

## Worker Management Issues

### Can't Add Worker - "Email already exists"

**Issue:** Getting error when adding new worker

**Solutions:**

1. **Check if worker already exists**
   - Search for the worker in Workers list
   - They might already have an account

2. **Use different email**
   - Each worker needs unique email address
   - Use personal email, or create one (Gmail, etc.)

3. **Check for typos**
   - Make sure email is spelled correctly
   - One character difference = different email

---

### Worker Not Appearing in Dropdowns

**Issue:** Can't select a worker when creating schedule

**Possible causes:**
- Worker is deactivated
- Worker hasn't been saved yet
- Page needs refresh

**Solutions:**

1. **Check worker status**
   - Go to Workers page
   - Verify worker is marked "Active"
   - Inactive workers don't appear in dropdowns

2. **Refresh the page**
   - Close and reopen the form
   - Worker list should update

3. **Verify worker was saved**
   - Go to Workers page
   - Confirm worker is in the list

---

## Schedule Issues

### Can't Create Schedule

**Possible errors:**
- "Worker is required"
- "Date is required"
- "Time is invalid"

**Solutions:**

1. **Fill in all required fields**
   - Worker, Date, Start Time, End Time, Task are required
   - Look for red error messages

2. **Check date format**
   - Use the date picker
   - Don't type dates manually

3. **Check time format**
   - Use the time picker
   - Or use format like "7:00 AM" or "14:00"

4. **Verify worker is active**
   - Can't schedule inactive workers
   - Check Workers page

---

### Schedule Disappeared

**Issue:** Created a schedule but can't find it

**Solutions:**

1. **Check date range**
   - You might be viewing the wrong week
   - Use calendar navigation to find the date

2. **Check filters**
   - Clear worker filter
   - Clear field filter
   - Select "All Schedules"

3. **Refresh the page**
   - Schedule might not have updated
   - Press F5 to reload

---

### Can't Edit or Delete Schedule

**Possible causes:**
- Schedule is completed
- Don't have permission
- Schedule has linked time entry

**Solutions:**

1. **Check schedule status**
   - Completed schedules have restrictions
   - Can't delete if time entry exists

2. **Check your role**
   - Only Managers and Admins can edit schedules
   - Workers can only view their own

3. **Contact manager**
   - If you need to change a completed schedule
   - Manager can make changes

---

## Time Tracking Issues

### Can't Clock In

**Symptoms:**
- "Clock In" button is grayed out
- Getting error message

**Solutions:**

1. **Check if already clocked in**
   - You can only have one active time entry
   - Look for "Currently Working" message
   - Clock out first, then clock in again if needed

2. **Check permissions**
   - Make sure you're logged in as the correct user
   - Workers can only clock in as themselves

3. **Refresh the page**
   - Sometimes the button doesn't update
   - F5 to reload

---

### Can't Clock Out

**Symptoms:**
- "Clock Out" button is grayed out
- No active time entry

**Solutions:**

1. **Verify you're clocked in**
   - Look for active time entry
   - Check for "Currently Working" status

2. **Check correct worker**
   - If you're a manager, verify you selected the right worker

3. **Refresh the page**
   - Page might be out of sync
   - Reload to see current status

---

### Forgot to Clock In/Out

**See:** [Time Tracking Guide - Common Workflows](time-tracking.md#common-workflows)

**Summary:**
- Edit the time entry manually
- Add note explaining the correction
- Manager can create/edit entries

---

### Time Calculation is Wrong

**Issue:** Total hours doesn't match clock in/out times

**Explanation:**
- Total hours = Clock out - Clock in - Break time
- Break time is deducted from total

**Example:**
- In: 7:00 AM
- Out: 3:00 PM
- Total time: 8 hours
- Break: 30 minutes
- **Paid hours: 7.5 hours** ✓

**Solution:**
- Check if break time was entered
- Verify all times are correct
- Use a time calculator to double-check

---

### Can't Verify Time Entry

**Issue:** Manager can't verify a time entry

**Possible causes:**
- Entry is already verified
- Entry is still active (not clocked out)
- Permission issue

**Solutions:**

1. **Check status**
   - Can only verify "Pending" entries
   - Already verified entries are locked

2. **Ensure worker clocked out**
   - Active entries can't be verified
   - Clock out the worker first

3. **Check your role**
   - Only Managers and Admins can verify
   - Workers can't verify their own time

---

## Browser and Device Issues

### Mobile Display Issues

**Issue:** Farm Commons doesn't look right on phone

**Solutions:**

1. **Use landscape mode**
   - Rotate phone sideways
   - More screen space for tables

2. **Zoom out**
   - Pinch to zoom out
   - Some elements are optimized for larger screens

3. **Update mobile browser**
   - Use latest version of Chrome, Safari, or Firefox
   - Older browsers may not work correctly

4. **Use desktop site**
   - As last resort, request desktop site
   - Chrome: Menu > Desktop Site
   - Safari: Share > Request Desktop Website

---

### Browser Compatibility

**Recommended browsers:**
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

**Not supported:**
- ❌ Internet Explorer (any version)
- ❌ Very old browsers (5+ years old)

**Solutions:**
- Update your browser
- Or switch to a recommended browser

---

### JavaScript Errors

**Symptoms:**
- Buttons don't work
- Forms don't submit
- Pages don't load properly

**Solutions:**

1. **Enable JavaScript**
   - Farm Commons requires JavaScript
   - Check browser settings to enable it

2. **Disable browser extensions**
   - Ad blockers can break functionality
   - Try disabling extensions temporarily

3. **Clear cache**
   - Old cached files can cause errors
   - Clear browsing data and reload

---

## Common Error Messages

### "Session expired. Please log in again."

**Meaning:** Your login session timed out

**Solution:**
- Just log in again
- Sessions expire after 24 hours for security

---

### "You don't have permission to perform this action"

**Meaning:** You're trying to do something your role doesn't allow

**Solution:**
- Check your user role (Worker, Manager, Admin)
- Contact administrator if you need different permissions
- Make sure you're logged in as the correct user

---

### "Network error. Please try again."

**Meaning:** Connection to server failed

**Solutions:**
1. Check internet connection
2. Wait a moment and try again
3. Refresh the page
4. Check if server is down (ask administrator)

---

### "Validation error" or "Invalid data"

**Meaning:** Form data doesn't meet requirements

**Solutions:**
1. Read the error message carefully
2. Check for required fields (marked with *)
3. Verify format (dates, times, emails, phone numbers)
4. Remove any special characters
5. Make sure all fields make sense

---

### "Server error (500)"

**Meaning:** Something went wrong on the server

**Solutions:**
1. Wait a minute and try again
2. Refresh the page
3. If persists, contact your farm administrator
4. Report to technical support with details

---

## Reporting Bugs

### What is a Bug?

A bug is an unexpected behavior or error in the software:

**Examples of bugs:**
- ✅ "Clock out button doesn't work"
- ✅ "Time calculation is wrong"
- ✅ "Page shows blank screen"
- ✅ "Data disappears after saving"

**Not bugs:**
- ❌ "I don't know how to do X" (see guides)
- ❌ "I wish it had feature Y" (that's a feature request)
- ❌ "It's slow" (without specific details)

---

### How to Report a Bug

**For users:**
1. Document the issue:
   - What you were doing
   - What happened
   - What you expected
   - Error messages
   - Screenshots if possible
2. Report to your farm administrator
3. Administrator will report to developers if needed

**For administrators and developers:**
1. Go to https://github.com/neighborhood-lab/farm-commons/issues
2. Click "New Issue"
3. Choose "Bug Report" template
4. Fill in all details:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment (browser, OS, device)
   - Screenshots or screen recordings
   - Error messages from browser console
5. Submit the issue

---

### Good Bug Reports

**Bad bug report:**
> "It doesn't work"

**Good bug report:**
> **Title:** Clock out button disabled after clocking in
>
> **Steps to reproduce:**
> 1. Log in as worker
> 2. Go to Time Tracking page
> 3. Click "Clock In"
> 4. Try to click "Clock Out" immediately
>
> **Expected:** Should be able to clock out
>
> **Actual:** Clock Out button is grayed out and disabled
>
> **Environment:** Chrome 120, Windows 11, Desktop
>
> **Screenshot:** [attached]
>
> **Console errors:** [none]

The good report provides all the information needed to understand and fix the issue.

---

## Prevention Tips

### Avoid Common Issues

**Best Practices:**

1. **Use recommended browsers**
   - Keep browser updated
   - Stick to Chrome, Firefox, Safari, or Edge

2. **Stable internet connection**
   - Save frequently
   - Don't submit forms on unstable connections

3. **Log out properly**
   - Use "Log Out" button
   - Don't just close browser

4. **Keep data current**
   - Update contact info when it changes
   - Deactivate workers who leave

5. **Regular maintenance**
   - Clear browser cache monthly
   - Update browser regularly
   - Check for Farm Commons updates

---

## Getting More Help

### Documentation

- **[Getting Started Guide](README.md)** - Basics and first steps
- **[Worker Management](worker-management.md)** - Staff directory
- **[Scheduling](scheduling.md)** - Work assignments
- **[Time Tracking](time-tracking.md)** - Clock in/out and payroll

### Community Support

- **GitHub Issues:** https://github.com/neighborhood-lab/farm-commons/issues
- **GitHub Discussions:** https://github.com/neighborhood-lab/farm-commons/discussions
- **Documentation:** Full guides for all features

### Professional Support

For farms that need dedicated support:
- Custom training sessions
- On-site setup assistance
- Priority bug fixes
- Feature development

*(Contact information and pricing coming soon)*

---

## Still Having Issues?

If this guide didn't solve your problem:

1. **Check other documentation**
   - Feature-specific guides may have more detail
   - Developer docs for technical issues

2. **Ask your administrator**
   - They may have farm-specific solutions
   - They can check logs and system status

3. **Search GitHub Issues**
   - Someone may have reported the same problem
   - Solutions are often posted there

4. **Report a new issue**
   - Help improve Farm Commons
   - Your feedback makes the software better

---

**Thank you for using Farm Commons!** 🚜🌾

*Remember: Farm Commons is community-owned software. Your feedback and bug reports help make it better for everyone.*
