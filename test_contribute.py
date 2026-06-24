import unittest
import contribute
from subprocess import check_output
import os
import shutil


class TestContribute(unittest.TestCase):

    def test_arguments(self):
        args = contribute.arguments(['-nw'])
        self.assertTrue(args.no_weekends)
        self.assertEqual(args.max_commits, 10)
        self.assertTrue(1 <= contribute.contributions_per_day(args) <= 20)

    def test_contributions_per_day(self):
        args = contribute.arguments(['-nw'])
        self.assertTrue(1 <= contribute.contributions_per_day(args) <= 20)

    def test_commits(self):
        orig_dir = os.getcwd()
        try:
            contribute.main(['-nw',
                             '--user_name=sampleusername',
                             '--user_email=your-username@users.noreply.github.com',
                             '-mc=12',
                             '-fr=82',
                             '-db=10',
                             '-da=15'])
            self.assertTrue(1 <= int(check_output(
                ['git',
                 'rev-list',
                 '--count',
                 'HEAD']
            ).decode('utf-8')) <= 20*(10 + 15))
        finally:
            gen_dir = os.getcwd()
            os.chdir(orig_dir)
            if gen_dir != orig_dir and os.path.exists(gen_dir):
                shutil.rmtree(gen_dir)

    def test_custom_dates(self):
        orig_dir = os.getcwd()
        try:
            contribute.main(['-d=2026-05-01,2026-05-02,2026-05-03',
                             '-mc=2'])
            commit_count = int(check_output(
                ['git',
                 'rev-list',
                 '--count',
                 'HEAD']
            ).decode('utf-8'))
            self.assertTrue(3 <= commit_count <= 6)
        finally:
            gen_dir = os.getcwd()
            os.chdir(orig_dir)
            if gen_dir != orig_dir and os.path.exists(gen_dir):
                shutil.rmtree(gen_dir)


