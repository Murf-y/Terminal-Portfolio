/* Renders .astro components with Astro's container API, the same server renderer the build uses,
   so tests exercise the real markup that ships. */
import { experimental_AstroContainer as AstroContainer, type ContainerRenderOptions } from 'astro/container'

type AstroComponent = Parameters<AstroContainer['renderToString']>[0]

let container: AstroContainer | null = null

async function render(component: AstroComponent, options?: ContainerRenderOptions): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(component, options)
}

/** Renders a component into document.body, replacing what was there. */
export async function mount(component: AstroComponent, options?: ContainerRenderOptions): Promise<HTMLElement> {
  document.body.innerHTML = await render(component, options)
  return document.body
}

/** Renders a page as a full document, and mounts its body into document.body. */
export async function mountPage(page: AstroComponent): Promise<Document> {
  const html = await render(page, { partial: false })
  const rendered = new DOMParser().parseFromString(html, 'text/html')
  document.body.innerHTML = rendered.body.innerHTML
  return rendered
}
