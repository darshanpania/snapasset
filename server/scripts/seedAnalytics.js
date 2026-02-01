/**
 * Seed Analytics Data
 * Generates sample analytics data for testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const platforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube'];
const eventTypes = [
  'image_generated',
  'image_downloaded',
  'project_created',
  'project_updated',
  'page_view',
];

const generateRandomDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const generateEvents = (userId, days = 30, eventsPerDay = 5) => {
  const events = [];

  for (let day = 0; day < days; day++) {
    for (let i = 0; i < eventsPerDay; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      events.push({
        user_id: userId,
        session_id: `session_${day}_${i}`,
        event_type: eventType,
        event_category: eventType.includes('image') ? 'generation' : 'project',
        event_action: 'create',
        platform: eventType.includes('image') ? platform : null,
        metadata: {
          test_data: true,
          platform: platform,
        },
        created_at: generateRandomDate(day),
      });
    }
  }

  return events;
};

const seedAnalytics = async () => {
  try {
    console.log('Starting analytics data seeding...');

    // Get first user
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('No users found. Please create a user first.');
      return;
    }

    const userId = users[0].id;
    console.log(`Seeding data for user: ${userId}`);

    // Generate events
    const events = generateEvents(userId, 30, 10);
    console.log(`Generated ${events.length} events`);

    // Insert events in batches
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { error } = await supabase.from('analytics_events').insert(batch);

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(events.length / batchSize)}`);
      }
    }

    // Trigger aggregation
    console.log('Triggering daily aggregation...');
    const { error: aggError } = await supabase.rpc('aggregate_daily_usage');
    
    if (aggError) {
      console.error('Aggregation error:', aggError);
    } else {
      console.log('Aggregation completed');
    }

    console.log('\n✅ Analytics seeding completed!');
    console.log('You can now view the analytics dashboard.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit();
  }
};

seedAnalytics();