import { View, Text } from "react-native";
import { TripData } from "./[id]"

type ActivitiesProps = {
  tripDetails: TripData
}
export function Activities({ tripDetails }: ActivitiesProps) {
  return (
    <View>
      <Text className="text-white text-2xl">
        {tripDetails.destination}
      </Text>
    </View>
  )
}