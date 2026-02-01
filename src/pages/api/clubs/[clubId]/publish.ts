import type { APIRoute } from 'astro';
import { DatabaseService } from '../../../../lib/db';
import { getAuthContext } from '../../../../lib/auth';

interface PublishResult {
  platform: string;
  success: boolean;
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

async function publishToFacebook(
  connection: { access_token: string; page_id: string | null },
  content: { message: string; link?: string; imageUrl?: string }
): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!connection.page_id) {
    return { success: false, error: 'No Facebook page connected' };
  }

  try {
    const apiUrl = `https://graph.facebook.com/v18.0/${connection.page_id}/feed`;

    const body: Record<string, string> = {
      message: content.message,
      access_token: connection.access_token,
    };

    if (content.link) {
      body.link = content.link;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Facebook API error:', data);
      return { success: false, error: data.error?.message || 'Facebook API error' };
    }

    return { success: true, postId: data.id };
  } catch (error) {
    console.error('Error publishing to Facebook:', error);
    return { success: false, error: 'Failed to publish to Facebook' };
  }
}

async function publishToTwitter(
  connection: { access_token: string; refresh_token?: string | null },
  content: { message: string; link?: string; imageUrl?: string }
): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  try {
    // Twitter API v2 - Create Tweet
    const apiUrl = 'https://api.twitter.com/2/tweets';

    // Construct tweet text (Twitter has 280 character limit)
    let tweetText = content.message;
    if (content.link) {
      // Add link to tweet (Twitter auto-shortens URLs to ~23 chars)
      tweetText = `${content.message}\n\n${content.link}`;
    }

    // Truncate if needed (leave room for link)
    if (tweetText.length > 280) {
      const maxMessageLength = content.link ? 250 : 280;
      tweetText = content.message.substring(0, maxMessageLength) + '...';
      if (content.link) {
        tweetText += `\n\n${content.link}`;
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: tweetText,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twitter API error:', data);
      return { success: false, error: data.detail || data.title || 'Twitter API error' };
    }

    return { success: true, tweetId: data.data?.id };
  } catch (error) {
    console.error('Error publishing to Twitter:', error);
    return { success: false, error: 'Failed to publish to Twitter' };
  }
}

async function publishToInstagram(
  connection: { access_token: string; page_id: string | null },
  content: { message: string; link?: string; imageUrl?: string }
): Promise<{ success: boolean; postId?: string; error?: string }> {
  if (!connection.page_id) {
    return { success: false, error: 'No Instagram account connected' };
  }

  if (!content.imageUrl) {
    return { success: false, error: 'Instagram posts require an image' };
  }

  try {
    // Step 1: Get Instagram Business Account ID linked to the Facebook Page
    const pageResponse = await fetch(
      `https://graph.facebook.com/v18.0/${connection.page_id}?fields=instagram_business_account&access_token=${connection.access_token}`
    );

    const pageData = await pageResponse.json();

    if (!pageData.instagram_business_account?.id) {
      return { success: false, error: 'No Instagram Business Account linked to this Facebook Page' };
    }

    const igAccountId = pageData.instagram_business_account.id;

    // Step 2: Create media container
    const containerUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media`;
    const containerParams = new URLSearchParams({
      image_url: content.imageUrl,
      caption: content.message + (content.link ? `\n\n${content.link}` : ''),
      access_token: connection.access_token,
    });

    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: containerParams.toString(),
    });

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || !containerData.id) {
      console.error('Instagram container creation error:', containerData);
      return { success: false, error: containerData.error?.message || 'Failed to create Instagram media container' };
    }

    // Step 3: Publish the media container
    const publishUrl = `https://graph.facebook.com/v18.0/${igAccountId}/media_publish`;
    const publishParams = new URLSearchParams({
      creation_id: containerData.id,
      access_token: connection.access_token,
    });

    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: publishParams.toString(),
    });

    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      console.error('Instagram publish error:', publishData);
      return { success: false, error: publishData.error?.message || 'Failed to publish to Instagram' };
    }

    return { success: true, postId: publishData.id };
  } catch (error) {
    console.error('Error publishing to Instagram:', error);
    return { success: false, error: 'Failed to publish to Instagram' };
  }
}

// POST /api/clubs/[clubId]/publish - Publish content to platforms
export const POST: APIRoute = async ({ params, request, cookies, locals }) => {
  try {
    const { clubId } = params;
    if (!clubId) {
      return new Response(JSON.stringify({ error: 'Club ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = new DatabaseService(locals.runtime.env.DB!, locals.runtime.env.ENCRYPTION_SECRET);
    const { user } = await getAuthContext(cookies, db);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const member = await db.getClubMember(clubId, user.id);
    if (!member) {
      return new Response(JSON.stringify({ error: 'Not a member of this club' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only admin and pro can publish
    if (!['admin', 'pro'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { entityType, entityId, platforms } = body;

    if (!entityType || !entityId) {
      return new Response(JSON.stringify({ error: 'Entity type and ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one platform required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const club = await db.getClubById(clubId);
    if (!club) {
      return new Response(JSON.stringify({ error: 'Club not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const siteUrl = locals.runtime.env.SITE_URL || 'https://clubify.ie';

    // Build content based on entity type
    let content: { message: string; link?: string; imageUrl?: string };

    if (entityType === 'post') {
      const post = await db.getPostBySlug(clubId, entityId).catch(() => null);

      // Try to get post by ID if slug didn't work
      const postResult = post || await locals.runtime.env.DB!.prepare(
        'SELECT * FROM posts WHERE id = ? AND club_id = ?'
      ).bind(entityId, clubId).first();

      if (!postResult) {
        return new Response(JSON.stringify({ error: 'Post not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      content = {
        message: `${postResult.title}\n\n${postResult.summary || ''}`.trim(),
        link: `${siteUrl}/${club.slug}/news/${postResult.slug}`,
        imageUrl: postResult.featured_image || undefined,
      };
    } else if (entityType === 'fixture_result') {
      const fixture = await db.getFixtureById(entityId);
      if (!fixture || fixture.club_id !== clubId) {
        return new Response(JSON.stringify({ error: 'Fixture not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (fixture.status !== 'played') {
        return new Response(JSON.stringify({ error: 'Fixture has no result yet' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Format GAA score
      const formatScore = (goals: number, points: number) => `${goals}-${String(points).padStart(2, '0')}`;
      const homeScore = formatScore(fixture.home_goals || 0, fixture.home_points || 0);
      const awayScore = formatScore(fixture.away_goals || 0, fixture.away_points || 0);

      // Determine opponent based on whether club is home or away
      const opponent = fixture.is_home ? fixture.away_team : fixture.home_team;

      const resultText = fixture.is_home
        ? `${club.name} ${homeScore} - ${awayScore} ${opponent}`
        : `${opponent} ${homeScore} - ${awayScore} ${club.name}`;

      const resultType = fixture.result === 'win' ? 'Victory!' :
                        fixture.result === 'loss' ? 'Result' : 'Draw';

      content = {
        message: `${resultType} ${fixture.competition || ''}\n\n${resultText}`.trim(),
        link: `${siteUrl}/${club.slug}`,
      };
    } else {
      return new Response(JSON.stringify({ error: 'Invalid entity type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create publish job
    const job = await db.createPublishJob({
      clubId,
      entityType,
      entityId,
      platforms,
      createdBy: user.id,
    });

    // Process publishing
    const results: PublishResult[] = [];

    for (const platform of platforms) {
      if (platform === 'facebook') {
        const connection = await db.getSocialConnection(clubId, 'facebook');
        if (!connection) {
          results.push({
            platform: 'facebook',
            success: false,
            error: 'Facebook not connected',
          });
          continue;
        }

        const fbResult = await publishToFacebook(connection, content);
        results.push({
          platform: 'facebook',
          success: fbResult.success,
          externalId: fbResult.postId,
          externalUrl: fbResult.postId
            ? `https://www.facebook.com/${fbResult.postId}`
            : undefined,
          error: fbResult.error,
        });

        // Record history if successful
        if (fbResult.success) {
          await db.recordPublishHistory({
            clubId,
            entityType,
            entityId,
            platform: 'facebook',
            externalId: fbResult.postId,
            externalUrl: `https://www.facebook.com/${fbResult.postId}`,
            publishedBy: user.id,
          });
        }
      } else if (platform === 'twitter') {
        const connection = await db.getSocialConnection(clubId, 'twitter');
        if (!connection) {
          results.push({
            platform: 'twitter',
            success: false,
            error: 'Twitter not connected',
          });
          continue;
        }

        const twitterResult = await publishToTwitter(connection, content);
        results.push({
          platform: 'twitter',
          success: twitterResult.success,
          externalId: twitterResult.tweetId,
          externalUrl: twitterResult.tweetId
            ? `https://twitter.com/i/web/status/${twitterResult.tweetId}`
            : undefined,
          error: twitterResult.error,
        });

        // Record history if successful
        if (twitterResult.success) {
          await db.recordPublishHistory({
            clubId,
            entityType,
            entityId,
            platform: 'twitter',
            externalId: twitterResult.tweetId,
            externalUrl: `https://twitter.com/i/web/status/${twitterResult.tweetId}`,
            publishedBy: user.id,
          });
        }
      } else if (platform === 'instagram') {
        const connection = await db.getSocialConnection(clubId, 'instagram');
        if (!connection) {
          results.push({
            platform: 'instagram',
            success: false,
            error: 'Instagram not connected',
          });
          continue;
        }

        const igResult = await publishToInstagram(connection, content);
        results.push({
          platform: 'instagram',
          success: igResult.success,
          externalId: igResult.postId,
          externalUrl: igResult.postId
            ? `https://www.instagram.com/p/${igResult.postId}/`
            : undefined,
          error: igResult.error,
        });

        // Record history if successful
        if (igResult.success) {
          await db.recordPublishHistory({
            clubId,
            entityType,
            entityId,
            platform: 'instagram',
            externalId: igResult.postId,
            externalUrl: `https://www.instagram.com/p/${igResult.postId}/`,
            publishedBy: user.id,
          });
        }
      } else if (platform === 'website') {
        // Website is automatically updated when post is published
        // Just record it in history
        await db.recordPublishHistory({
          clubId,
          entityType,
          entityId,
          platform: 'website',
          externalUrl: content.link,
          publishedBy: user.id,
        });
        results.push({
          platform: 'website',
          success: true,
          externalUrl: content.link,
        });
      }
    }

    // Update job with results
    const allSuccessful = results.every(r => r.success);
    await db.updatePublishJob(job.id, {
      status: allSuccessful ? 'completed' : 'failed',
      results: JSON.stringify(results),
      errorMessage: allSuccessful ? undefined : results.find(r => !r.success)?.error,
      completedAt: new Date().toISOString(),
    });

    // Log audit
    await db.logAudit({
      clubId,
      userId: user.id,
      action: 'content_published',
      entityType,
      entityId,
      details: JSON.stringify({ platforms, results }),
    });

    return new Response(JSON.stringify({
      success: allSuccessful,
      results,
      job: { id: job.id, status: allSuccessful ? 'completed' : 'failed' },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error publishing content:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
