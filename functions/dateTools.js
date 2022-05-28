//Leap year check
function isLeapYear(year) {
    let leapYearCheck = 0;
  
    if (year % 4 === 0) {
      leapYearCheck = 1;
    }
  
    if (year % 100 === 0 && year % 400 != 0) {
      leapYearCheck = 0;
    }
  
    if (leapYearCheck === 1) {
  
      return true;
    } else {
  
      return false;
    }
  }

//check if the day is exists
function validDayCheck(d, m, y) {
  
    let dayFlag = 0;
    let monthFlag = 0;
    let yearFlag = 0;
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let leapYear = isLeapYear(y);
  
    if (leapYear) {
      monthDays[1] += 1;
    }
  
    if (y > 0 && y <= 9999) yearFlag = true;
    if (m > 0 && m <= 12) monthFlag = true;
  
    if (d > 0 && d <= 31) {
      if (d <= monthDays[m - 1]) {
        dayFlag = true;
      }
    }
  
  
    if (yearFlag && monthFlag && dayFlag) {
      return true;
    } else {
      return false;
    }
  }
  
  //=====================
  
  
  //Checks if first date is in the future
  function dobCheckFuture(myDOB, currentDateCheck) {
    if (myDOB.year > currentDateCheck.year) {
      return false;
    }
  
    else if (myDOB.year === currentDateCheck.year) {
      if (myDOB.month > currentDateCheck.month) {
        return false;
      }
      else if (myDOB.month === currentDateCheck.month) {
        if (myDOB.day >= currentDateCheck.day) {
          return false;
        }
  
      }
    }
    return true;
  }

  module.exports = {validDayCheck,dobCheckFuture,isLeapYear};