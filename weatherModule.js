export default {
  async fetch(request, env) {
    return await handleRequest(request, env).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  }
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request, env) {
  const { pathname } = new URL(request.url);
  let pathParts = pathname.split("/")
  pathParts.shift();

  if (pathParts[0] == "workersai") {
    pathParts.shift();
    return await handleWorkersAIRequest(request, env, pathParts).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  }

  else if (pathParts[0] == "openai") {
    pathParts.shift();
    return await handleOpenAIRequest(request, env, pathParts).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  }

  return fetch("https://welcome.developers.workers.dev");
}

/**
 * @param {Request} request
 * @param {Array<String>} pathParts
 * @returns {Promise<Response>}
 */
async function handleWorkersAIRequest(request, env, pathParts) {
    const prompt = pathParts[0].replace(/\+/g, ' ');

    const inputs = {
      prompt: 'An atmospheric scene showcasing the following: ' + prompt,
    };
    
    const response = await env.AI.run(
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      inputs,
    );
    
    return new Response(response, {
      headers: {
        'content-type': 'image/png',
      },
    });
}

/**
 * @param {Request} request
 * @param {Array<String>} pathParts
 * @returns {Promise<Response>}
 */
async function handleOpenAIRequest(request, env, pathParts) {
  const prompt = pathParts[0].replace(/\+/g, ' ');

  try {
    if (!prompt) {
      return new Response('Prompt is required', { status: 400 })
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${{secrets.OPENAI_API_KEY}}`, 
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: 'An atmospheric scene showcasing the following: ' + prompt,
        n: 1,
        size: '1792x1024'
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      return new Response(`OpenAI API error: ${errorText}`, { status: openaiResponse.status })
    }

    const openaiResult = await openaiResponse.json()
    const imageUrl = openaiResult.data[0].url

    return Response.redirect(imageUrl, 302)
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}
