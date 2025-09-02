import { getPolls, getPoll, createPoll, deletePoll, updatePoll } from '../polls';
import { supabase } from '../supabase';
import { getCurrentUser } from '../auth';

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  },
}));

jest.mock('../auth', () => ({
  getCurrentUser: jest.fn(),
}));

describe('Poll Actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all polls', async () => {
    const mockPolls = [{ id: '1', question: 'Test Poll' }];
    (supabase.from('polls').select as jest.Mock).mockResolvedValueOnce({ data: mockPolls, error: null });

    const polls = await getPolls();
    expect(polls).toEqual(mockPolls);
    expect(supabase.from).toHaveBeenCalledWith('polls');
    expect(supabase.from('polls').select).toHaveBeenCalledWith('*');
  });

  it('should fetch a single poll', async () => {
    const mockPoll = { id: '1', question: 'Test Poll' };
    (supabase.from('polls').select as jest.Mock).mockReturnThis();
    (supabase.from('polls').select('*').eq as jest.Mock).mockReturnThis();
    (supabase.from('polls').select('*').eq('id', '1').single as jest.Mock).mockResolvedValueOnce({ data: mockPoll, error: null });

    const poll = await getPoll('1');
    expect(poll).toEqual(mockPoll);
  });

  it('should create a poll', async () => {
    const mockUser = { id: 'user-123' };
    (getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);

    const newPollData = { question: 'New Poll', options: ['A', 'B'] };
    const createdPoll = { ...newPollData, id: '2', creator_id: mockUser.id };
    (supabase.from('polls').insert as jest.Mock).mockReturnThis();
    (supabase.from('polls').insert([]).select as jest.Mock).mockResolvedValueOnce({ data: [createdPoll], error: null });

    const result = await createPoll(newPollData);
    expect(result.data).toEqual([createdPoll]);
  });

  it('should delete a poll', async () => {
    (supabase.from('polls').delete as jest.Mock).mockReturnThis();
    (supabase.from('polls').delete().eq as jest.Mock).mockResolvedValueOnce({ data: null, error: null });

    const result = await deletePoll('1');
    expect(result.data).toBeNull();
  });

  it('should update a poll', async () => {
    const updatedPollData = { question: 'Updated Poll', options: ['C', 'D'] };
    const updatedPoll = { ...updatedPollData, id: '1' };
    (supabase.from('polls').update as jest.Mock).mockReturnThis();
    (supabase.from('polls').update(updatedPollData).eq as jest.Mock).mockReturnThis();
    (supabase.from('polls').update(updatedPollData).eq('id', '1').select as jest.Mock).mockResolvedValueOnce({ data: [updatedPoll], error: null });

    const result = await updatePoll('1', updatedPollData);
    expect(result.data).toEqual([updatedPoll]);
  });
});
