#!/bin/bash
# Set up cron jobs for scheduled AI tasks
# Run this once to install the crontab entries

PYTHON="/opt/homebrew/Caskroom/miniconda/base/envs/GPTSoVits/bin/python"
PROJECT="/Users/teddy/GPT-SoVITS"

# Create cron entries
(crontab -l 2>/dev/null; cat << EOF

# === Jorge Ramirez Group CRM — Scheduled Tasks ===

# AI Follow-up Engine — runs daily at 8am and 2pm
0 8 * * * cd $PROJECT && $PYTHON src/ai/follow_up_engine.py >> /tmp/crm-followup.log 2>&1
0 14 * * * cd $PROJECT && $PYTHON src/ai/follow_up_engine.py >> /tmp/crm-followup.log 2>&1

# AI Newsletter — runs every Monday at 9am
0 9 * * 1 cd $PROJECT && $PYTHON src/ai/newsletter_engine.py >> /tmp/crm-newsletter.log 2>&1

# AI Home Value Reports — runs 1st of each month at 10am
0 10 1 * * cd $PROJECT && $PYTHON src/ai/home_value_report.py >> /tmp/crm-homevalue.log 2>&1

# AI Review Responder — runs every 4 hours
0 */4 * * * cd $PROJECT && $PYTHON src/ai/review_responder.py >> /tmp/crm-reviews.log 2>&1

EOF
) | crontab -

echo "Cron jobs installed:"
crontab -l | grep "Jorge\|follow_up\|newsletter\|home_value\|review_responder"
