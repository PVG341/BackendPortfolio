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
COPY apps/api apps/api

RUN pnpm --filter @portfolio/contracts build \
 && pnpm --filter @portfolio/api build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /repo/packages/contracts/dist ./packages/contracts/dist

USER node
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]