import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';
import type { AppLoadContext, EntryContext } from 'react-router';
import { isbot } from 'isbot';

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
) {
  return new Promise((resolve, reject) => {
    const userAgent = request.headers.get('user-agent');
    const callbackName = userAgent && isbot(userAgent) ? 'onAllReady' : 'onShellReady';

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [callbackName]: () => {
          const body = new ReadableStream({
            start(controller) {
              pipe(
                new WritableStream({
                  write(chunk) {
                    controller.enqueue(chunk);
                  },
                  close() {
                    controller.close();
                  },
                  abort(err) {
                    controller.error(err);
                  },
                }),
              );
            },
          });

          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          console.error(error);
        },
      } as RenderToPipeableStreamOptions,
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
