import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Map backend Campaign model to UI shape expected by components like ProjectCard
const mapCampaignToUI = (c) => ({
  _id: c._id,
  project_name: c.title,
  description: c.description,
  about_entrepreneur: c.aboutEntrepreneur,
  cover_image: c.coverImageUrl,
  fund_type: c.fundingType,
  amount: c.fundingGoalINR,
  funding_deadline: c.fundingDeadline,
  project_deadline: c.projectDeadline,
  amountRaisedINR: c.amountRaisedINR,
  backersCount: c.backersCount,
  owner: c.owner,
  status: c.status,
  createdAt: c.createdAt,
});

// Async thunk to fetch campaigns (public browse)
export const fetchCampaigns = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/campaigns?status=active`, {
        method: 'GET',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }

      const data = await res.json();

      console.log('Fetched campaigns data:', data); // debug log

      if (data?.success) {
        return (data.campaigns || []).map(mapCampaignToUI);
      }
      throw new Error(data?.message || 'Failed to fetch campaigns');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      return rejectWithValue(err.message || 'Unknown error');
    }
  }
);

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState: {
    items: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    lastFetched: null,
  },
  reducers: {
    setCampaigns(state, action) {
      state.items = (action.payload || []).map(mapCampaignToUI);
      state.status = 'succeeded';
      state.error = null;
      state.lastFetched = Date.now();
    },
    clearCampaigns(state) {
      state.items = [];
      state.status = 'idle';
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.items = action.payload || [];
        state.status = 'succeeded';
        state.error = null;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || action.error?.message || 'Failed to fetch campaigns';
      });
  },
});

export const { setCampaigns, clearCampaigns } = campaignsSlice.actions;

export const selectCampaigns = (state) => state.campaigns.items;
export const selectCampaignsStatus = (state) => state.campaigns.status;
export const selectCampaignsError = (state) => state.campaigns.error;

export default campaignsSlice.reducer;
