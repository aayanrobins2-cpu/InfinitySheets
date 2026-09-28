import { enrolledSubjectEntries, subjectEntries, subjectRoute } from './subjects';
import { RESOURCE_TRACKS } from '../data/resources';

const courses = [
  { id: 'ap', exam: 'AP', subjects: [{ subject: 'Chemistry' }] },
  { id: 'ib', exam: 'IB', subjects: [{ subject: 'Chemistry', ibLevel: 'HL' }] },
];

test('keeps same-named subjects separate by curriculum and level', () => {
  expect(subjectEntries(courses, 'AP')).toEqual([
    expect.objectContaining({ key: 'Chemistry|AP|', subject: 'Chemistry', board: 'AP' }),
    expect.objectContaining({ key: 'Chemistry|IB|HL', subject: 'Chemistry', board: 'IB', ibLevel: 'HL' }),
  ]);
  expect(enrolledSubjectEntries(courses, [], 'AP')).toHaveLength(2);
});

test('subject routes retain the curriculum identity', () => {
  expect(subjectRoute({ subject: 'Chemistry', board: 'IB', ibLevel: 'HL' }))
    .toBe('#study?subject=Chemistry&board=IB&level=HL');
});

test('lists AP in the public course directory', () => {
  expect(RESOURCE_TRACKS.some((track) => track.id === 'AP')).toBe(true);
});
