#!/usr/bin/env python3
"""Generate 100 commits with varied dates and times for GitHub activity."""
import os
import random
from datetime import datetime, timedelta
from subprocess import Popen

def run(commands):
    Popen(commands).wait()

def main():
    # Spread 100 commits across the last 120 days at random times
    now = datetime.now()
    
    # Generate 100 random dates within the last 120 days
    commits = []
    for _ in range(100):
        days_ago = random.randint(1, 120)
        hour = random.randint(7, 23)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        commit_date = now - timedelta(days=days_ago)
        commit_date = commit_date.replace(hour=hour, minute=minute, second=second)
        commits.append(commit_date)
    
    # Sort chronologically
    commits.sort()
    
    # Make commits
    for i, date in enumerate(commits, 1):
        date_str = date.strftime('%Y-%m-%d %H:%M:%S')
        msg = f"Activity update #{i}: {date.strftime('%b %d %Y at %H:%M')}"
        
        # Append to a log file
        with open('activity_log.md', 'a') as f:
            f.write(f"- Commit #{i} on {date_str}\n")
        
        run(['git', 'add', '.'])
        run(['git', 'commit', '-m', msg,
             '--date', date_str])
        
        print(f"[{i}/100] Committed: {date_str}")
    
    print("\n✅ All 100 commits created! Pushing to origin...")
    run(['git', 'push', 'origin', 'main'])
    print("🎉 Done! Check your GitHub profile in a few minutes.")

if __name__ == '__main__':
    main()
