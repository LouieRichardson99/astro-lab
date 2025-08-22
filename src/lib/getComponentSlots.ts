/**
 * Extracts slot information from a component's markup.
 * @param componentMarkup The markup of the component.
 * @returns An array of slot information objects.
 */
export default function getComponentSlots(
  componentMarkup: string
): { name: string }[] {
  const slotsMatch =
    componentMarkup.match(/<slot\b[^>]*?(?:\/>|>([\s\S]*?)<\/slot>)/g) || [];

  return slotsMatch.map((slot: string) => {
    const nameMatch = slot.match(/name="(\w+)"/);

    return {
      name: nameMatch ? nameMatch[1] : 'default'
    };
  });
}
