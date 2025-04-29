# Manual UI Test Plan for Supplemental Workout Exercises Feature

This document outlines steps to manually test the new exercises feature for supplemental workouts.

## Prerequisites

1. The server is running (`cd server && npm start`)
2. The client is running (`cd client && npm start`)
3. You are logged in as an admin user

## Test Scenarios

### 1. View Supplemental Workouts with Exercises

**Steps:**
1. Navigate to Admin > Supplemental Workouts
2. Verify the page loads without errors
3. Observe the table containing supplemental workouts
4. Check that the Exercises column is visible
5. Verify horizontal scrolling works if the table is too wide

**Expected Result:**
- The table displays correctly with all columns, including the Exercises column
- Horizontal scrolling functions properly if needed

### 2. Add an Exercise to a Supplemental Workout

**Steps:**
1. Navigate to Admin > Supplemental Workouts
2. Find a supplemental workout to add an exercise to
3. Click the "+ Add" button next to the workout's exercise count
4. Observe the exercise form appears at the top of the page
5. Enter an exercise name (e.g., "Test Exercise")
6. Enter an optional description
7. Click the "Add Exercise" button

**Expected Result:**
- The exercise form appears correctly when clicking "+ Add"
- After submission, a success message appears
- The exercise count increases by 1
- The new exercise appears in the exercise list for that workout

### 3. Edit an Exercise

**Steps:**
1. Navigate to Admin > Supplemental Workouts
2. Find a workout with existing exercises
3. Click the "Edit" button next to an exercise
4. Observe the edit form appears at the top of the page
5. Modify the exercise name and/or description
6. Click the "Update Exercise" button

**Expected Result:**
- The edit form appears pre-populated with the exercise's current data
- After submission, a success message appears
- The exercise list updates to show the modified exercise

### 4. Delete an Exercise

**Steps:**
1. Navigate to Admin > Supplemental Workouts
2. Find a workout with existing exercises
3. Click the "Delete" button next to an exercise
4. Confirm the deletion in the confirmation dialog

**Expected Result:**
- A confirmation dialog appears
- After confirmation, a success message appears
- The exercise is removed from the list
- The exercise count decreases by 1

### 5. Exercise List Overflow

**Steps:**
1. Navigate to Admin > Supplemental Workouts
2. Find a workout that has many exercises (or add several exercises to a workout)
3. Observe the exercises list in the table

**Expected Result:**
- If there are many exercises, the exercise list should have a vertical scrollbar
- The exercise list should be contained within its cell and not break the table layout

### 6. Responsive Design

**Steps:**
1. Navigate to Admin > Supplemental Workouts
2. Resize the browser window to different widths
3. Test on mobile device or using browser dev tools mobile view

**Expected Result:**
- The table should have horizontal scrolling on smaller screens
- The layout should adjust appropriately for different screen sizes
- All functionality should work on mobile devices

## Reporting Issues

If any issues are found during testing, please document:

1. Which test scenario and step the issue occurred in
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Browser and device information