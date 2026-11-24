import { redirect } from 'next/navigation'

export const instant = false

export default async function TrainingEvaluationRedirect({
  params,
}: PageProps<'/trainings/[trainingId]/evaluate'>) {
  const { trainingId } = await params
  redirect(`/trener/${trainingId}`)
}