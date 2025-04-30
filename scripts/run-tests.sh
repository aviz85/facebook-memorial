#!/bin/bash

# הגדרת צבעים
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# הדפסת הודעה
echo -e "${BLUE}=== מערכת הבדיקות של פרויקט facebook-memorial ===${NC}"

# התקנת תלויות אם הן לא קיימות
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}מתקין תלויות...${NC}"
  npm install
fi

# הרצת בדיקות יחידה
echo -e "\n${BLUE}=== בדיקות יחידה ===${NC}"
npm test
UNIT_RESULT=$?

# הרצת בדיקות אינטגרציה
echo -e "\n${BLUE}=== בדיקות אינטגרציה עם Supabase ===${NC}"
npm run test:integration
INTEGRATION_RESULT=$?

# הרצת בדיקות לייב
echo -e "\n${BLUE}=== בדיקות לייב מול Supabase ===${NC}"
npm run test:e2e
E2E_RESULT=$?

# תוצאות
echo -e "\n${BLUE}=== סיכום תוצאות ===${NC}"

if [ $UNIT_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ בדיקות יחידה עברו בהצלחה${NC}"
else
  echo -e "${RED}✗ נכשלו בדיקות יחידה${NC}"
fi

if [ $INTEGRATION_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ בדיקות אינטגרציה עברו בהצלחה${NC}"
else
  echo -e "${RED}✗ נכשלו בדיקות אינטגרציה${NC}"
fi

if [ $E2E_RESULT -eq 0 ]; then
  echo -e "${GREEN}✓ בדיקות לייב עברו בהצלחה${NC}"
else
  echo -e "${RED}✗ נכשלו בדיקות לייב${NC}"
fi

# קוד יציאה מסכם
if [ $UNIT_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ] && [ $E2E_RESULT -eq 0 ]; then
  echo -e "\n${GREEN}כל הבדיקות עברו בהצלחה!${NC}"
  exit 0
else
  echo -e "\n${RED}חלק מהבדיקות נכשלו.${NC}"
  exit 1
fi 