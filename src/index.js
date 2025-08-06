// index.js
import Resolver from '@forge/resolver';
import { storage } from '@forge/api';
import api, { route } from '@forge/api';

const resolver = new Resolver();
resolver.define('get-current-accountId', (req) => {
  return {
    accountId: req.context.accountId,
  };
});
// Fixed searchUsers function with correct CQL fields and multiple fallback approaches
resolver.define('searchUsers', async ({ payload }) => {
  const { query } = payload;
  console.log('Searching for users with query:', query);

  // Try multiple approaches since the API might have different behaviors
  const searchApproaches = [
    // Approach 1: Use only valid CQL fields
    async () => {
      const cqlQuery = `user.fullname~"${query}*"`;
      console.log('Trying approach 1 - CQL query:', cqlQuery);
      
      const response = await api.asApp().requestConfluence(
        route`/wiki/rest/api/search/user?cql=${cqlQuery}&limit=20`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      return { response, approach: 'fullname-search' };
    },
    
    // Approach 2: Try with user field only
    async () => {
      const cqlQuery = `user~"${query}*"`;
      console.log('Trying approach 2 - CQL query:', cqlQuery);
      
      const response = await api.asApp().requestConfluence(
        route`/wiki/rest/api/search/user?cql=${cqlQuery}&limit=20`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      return { response, approach: 'user-search' };
    },
    
    // Approach 3: Try user.accountid if we have email-like input
    async () => {
      if (query.includes('@') || query.includes('.')) {
        const cqlQuery = `user.accountid~"${query}*"`;
        console.log('Trying approach 3 - CQL query:', cqlQuery);
        
        const response = await api.asApp().requestConfluence(
          route`/wiki/rest/api/search/user?cql=${cqlQuery}&limit=20`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        return { response, approach: 'accountid-search' };
      }
      throw new Error('Skipping accountid search for non-email query');
    },
    
    // Approach 4: Try general content search as fallback
    async () => {
      const cqlQuery = `type=user AND text~"${query}*"`;
      console.log('Trying approach 4 - General search CQL:', cqlQuery);
      
      const response = await api.asApp().requestConfluence(
        route`/wiki/rest/api/search?cql=${cqlQuery}&limit=20`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      return { response, approach: 'general-search' };
    }
  ];

  for (let i = 0; i < searchApproaches.length; i++) {
    try {
      const { response, approach } = await searchApproaches[i]();
      
      console.log(`Approach ${i + 1} (${approach}) - Status:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Approach ${i + 1} successful:`, data);
        
        if (!data || !data.results || data.results.length === 0) {
          console.log(`Approach ${i + 1} returned no results, trying next approach`);
          continue;
        }
        
        // Process results based on the search type
        let users;
        if (approach === 'general-search') {
          // Handle general search results differently
          users = data.results
            .filter(item => item.user && item.user.type === 'known')
            .map(item => ({
              id: item.user.accountId || item.user.userKey,
              name: item.user.displayName || item.user.publicName || item.user.username,
              email: item.user.email,
              username: item.user.username
            }));
        } else {
          // Handle user-specific search results
          users = data.results
            .filter(item => item.user && item.user.type === 'known')
            .map(item => ({
              id: item.user.accountId || item.user.userKey,
              name: item.user.displayName || item.user.publicName || item.user.username,
              email: item.user.email,
              username: item.user.username
            }));
        }
        
        users = users.filter(user => user.id && user.name);
        
        console.log(`Approach ${i + 1} processed ${users.length} users`);
        
        if (users.length > 0) {
          return users;
        }
      } else {
        const errorText = await response.text();
        console.log(`Approach ${i + 1} failed with ${response.status}:`, errorText);
      }
      
    } catch (error) {
      console.log(`Approach ${i + 1} threw error:`, error.message);
    }
  }
  
  // If all approaches failed, return empty array
  console.log('All search approaches failed');
  return [];
});

// Alternative search method using different CQL approach
resolver.define('searchUsersAlternative', async ({ payload }) => {
  const { query } = payload;
  console.log('Alternative search for users with query:', query);

  try {
    // Try a simpler CQL query first
    const cqlQuery = `user~"${query}*"`;
    
    const searchRoute = route`/wiki/rest/api/search/user?cql=${cqlQuery}&limit=20`;
    
    const response = await api.asApp().requestConfluence(searchRoute, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Alternative search successful:', data);
      
      return data.results?.map(item => ({
        id: item.user?.accountId || item.user?.userKey,
        name: item.user?.displayName || item.user?.publicName,
        email: item.user?.email,
        username: item.user?.username
      })).filter(user => user.id && user.name) || [];
    }
    
    return { error: `Alternative search failed: ${response.status}` };
    
  } catch (error) {
    console.error('Alternative search error:', error);
    return { error: error.message };
  }
});

// Keep existing getUsers function for testing purposes
resolver.define('getUsers', async () => {
  try {
    console.log('Getting all users...');
    
    // Get users with a basic query
    const cqlQuery = 'user.type="known"';
    const searchRoute = route`/wiki/rest/api/search/user?cql=${cqlQuery}&limit=50`;
    
    const response = await api.asApp().requestConfluence(searchRoute, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Confluence API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    console.log('GetUsers response:', data);
    
    const users = data.results
      ?.filter(item => item.user && item.user.type === 'known')
      .map(item => ({
        id: item.user.accountId || item.user.userKey,
        name: item.user.displayName || item.user.publicName || item.user.username,
        email: item.user.email,
        username: item.user.username
      }))
      .filter(user => user.name && user.id) || [];

    console.log(`Found ${users.length} users`);
    return users;
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
});

resolver.define('addCourse', async ({ payload }) => {
  try {
    const courses = (await storage.get('courses')) || [];
    const updated = [...courses, payload];
    await storage.set('courses', updated);
    return { success: true };
  } catch (error) {
    console.error('Error adding course:', error);
    return { success: false, error: error.message };
  }
});

resolver.define('getCourses', async () => {
  try {
    const courses = await storage.get('courses');
    return courses || [];
  } catch (error) {
    console.error('Error getting courses:', error);
    return [];
  }
});

// Enhanced test function to help diagnose the 410 error
resolver.define('testUserAccess', async () => {
  console.log('Starting comprehensive API access test...');
  
  try {
    // Test 1: Basic API availability
    if (!api || !api.asApp) {
      return { 
        success: false, 
        error: 'API object or asApp method is undefined',
        test: 'basic_import'
      };
    }

    // Test 2: Try different basic endpoints to see which work
    const endpointsToTest = [
      { name: 'content', path: '/wiki/rest/api/content?limit=1' },
      { name: 'space', path: '/wiki/rest/api/space?limit=1' },
      { name: 'user-current', path: '/wiki/rest/api/user/current' },
      { name: 'user-search-endpoint', path: '/wiki/rest/api/search/user?cql=user.type="known"&limit=1' }
    ];
    
    const results = {};
    
    for (const endpoint of endpointsToTest) {
      try {
        console.log(`Testing ${endpoint.name} endpoint...`);
        const response = await api.asApp().requestConfluence(
          route`${endpoint.path}`, 
          { headers: { 'Accept': 'application/json' } }
        );
        
        results[endpoint.name] = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        };
        
        if (!response.ok && response.status !== 410) {
          const errorText = await response.text();
          results[endpoint.name].error = errorText.substring(0, 200);
        }
        
      } catch (error) {
        results[endpoint.name] = {
          error: error.message,
          type: 'exception'
        };
      }
    }

    // Test 3: Try a simple CQL search with valid fields only
    let cqlTestResult = null;
    try {
      const testCql = 'user.fullname~"*"';
      const cqlResponse = await api.asApp().requestConfluence(
        route`/wiki/rest/api/search/user?cql=${testCql}&limit=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      cqlTestResult = {
        status: cqlResponse.status,
        ok: cqlResponse.ok
      };
      
      if (cqlResponse.ok) {
        const cqlData = await cqlResponse.json();
        cqlTestResult.resultCount = cqlData.results?.length || 0;
      } else {
        const errorText = await cqlResponse.text();
        cqlTestResult.error = errorText.substring(0, 200);
      }
      
    } catch (error) {
      cqlTestResult = { error: error.message };
    }

    return {
      success: Object.values(results).some(r => r.ok),
      endpointTests: results,
      cqlTest: cqlTestResult,
      message: 'Comprehensive endpoint testing completed',
      recommendation: results['user-search-endpoint']?.status === 410 ? 
        'User search endpoint returns 410 - may be deprecated. Try alternative approaches.' :
        'Check individual endpoint results for issues.'
    };
    
  } catch (error) {
    console.error('API test error:', error);
    return { 
      success: false, 
      error: error.message,
      test: 'general_error'
    };
  }
});

export const handler = resolver.getDefinitions();