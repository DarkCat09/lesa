import re
import random
import asyncio
import unittest
import requests
import randomus
from datetime import datetime, timedelta

CSRF_MAIN = r'<input id="csrf_token" .+? value="(.+?)">'
CSRF_PARENT = r'<input id="parentslst-0-csrf_token" .+? value="(.+?)">'
CSRF_CHILD = r'<input id="childrenlst-0-csrf_token" .+? value="(.+?)">'

MAX_REQ = 100
COUNT = 200

class Test_RegPerformance(unittest.TestCase):

    def setUp(self):

        self.names = []
        repeat = COUNT / MAX_REQ
        i = repeat
        while i > 0:
            n = int(COUNT / repeat)
            self.names.extend(randomus.generate_names(n))
            i -= 1
    
    def test_performance(self):
        asyncio.run(self.performance())
    
    async def performance(self):

        loop = asyncio.get_event_loop()

        length = len(self.names)
        for i, n in enumerate(self.names):

            parts = n.split(' ')
            sur = parts[0]
            first = parts[1]
            mid = parts[2]

            next_name = n
            if i < length - 1:
                next_name = self.names[i + 1]
            next_parts = next_name.split(' ')
            next_first = next_parts[1]

            loop.create_task(
                self.register(
                    sur,
                    random.randint(0,1),
                    random.randint(1,5),
                    random.choice((410, 950)),

                    sur, first, mid,
                    self.phone(), 'test@example.com', '',

                    sur, next_first,
                    random.choice((0,1)),
                    '1998-01-05',

                    random.choice(('Aaa','Bbb','Ccc','Ddd'))
                )
            )

        for i in asyncio.all_tasks(loop):
            if (i.get_name() != 'Task-1'):
                await i
                res: timedelta = i.result()
                self.assertLessEqual(res.total_seconds(), 1.6)

    @staticmethod
    def phone() -> str:
        res = ''
        for _ in range(9):
            res += str(random.randint(0,9))
        return '9' + res
    
    @staticmethod
    def csrf() -> str:

        resp = requests.get('http://localhost:5000/page/register')
        resp.raise_for_status()
        csrf_main = re.search(CSRF_MAIN, resp.text)[1]
        return csrf_main
    
    async def register(
            self,
            family: str, dates: int,
            count: int, house: int,

            parent_surname: str,
            parent_name: str,
            parent_midname: str,
            parent_phone: str,
            parent_email: str,
            parent_social: str,

            child_surname: str,
            child_firstname: str,
            child_gender: str,
            child_bday: str,

            friends: str = '') -> timedelta:

        self.csrf_token = self.csrf()

        start = datetime.now()
        requests.post(
            url='http://localhost:5000/form/register',
            data={
                'csrf_token': self.csrf_token,
                'family': family,
                'dates': dates,
                'count': count,
                'children': 1,
                'meal_count': 1,
                'house': house,
                'friends': friends,
                'parentslst-0-csrf_token': self.csrf_token,
                'parentslst-0-surname': parent_surname,
                'parentslst-0-firstname': parent_name,
                'parentslst-0-midname': parent_midname,
                'parentslst-0-phone': parent_phone,
                'parentslst-0-email': parent_email,
                'parentslst-0-social': parent_social,
                'childrenlst-0-csrf_token': self.csrf_token,
                'childrenlst-0-surname': child_surname,
                'childrenlst-0-firstname': child_firstname,
                'childrenlst-0-gender': child_gender,
                'childrenlst-0-birthday': child_bday,
            }
        )
        end = datetime.now()
        return (end - start)
