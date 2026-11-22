FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
RUN pnpm install --frozen-lockfile

COPY packages/contracts packages/contracts
COPY apps/web apps/web

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter @portfolio/contracts build \
 && pnpm --filter @portfolio/web build

FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /repo

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/web/package.json ./apps/web/package.json
COPY --from=build /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /repo/apps/web/.next ./apps/web/.next
COPY --from=build /repo/apps/web/public ./apps/web/public
COPY --from=build /repo/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml ./
COPY --from=build /repo/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /repo/packages/contracts/dist ./packages/contracts/dist

USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "@portfolio/web", "exec", "next", "start", "-p", "3000", "-H", "0.0.0.0"]