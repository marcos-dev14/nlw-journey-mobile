import { Image, Text, View } from "react-native";
import { MapPin, Calendar as IconCalendar, Settings2, UserRoundPlus, ArrowRight } from "lucide-react-native"

import { colors } from "@/src/styles/colors"

import { Input } from "../components/input";
import { Button } from "../components/button";
import { useState } from "react";

enum StepFrom {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2,
}

export default function Index() {
  const [stepForm, setStepForm] = useState(StepFrom.TRIP_DETAILS)

  function handleNextStepForm() {
    if (stepForm === StepFrom.ADD_EMAIL) {
      return setStepForm(StepFrom.TRIP_DETAILS)
    }
  }

  return (
    <View className="flex-1 items-center justify-center px-5 relative">
      <Image 
        source={require('@/src/assets/logo.png')}
        className="h-8"
        resizeMode="contain"
      />

      <Image source={require('@/src/assets/bg.png')} className="absolute" />

      <Text className="text-zinc-400 font-regular text-center text-lg mt-3">
        Convide seus amigos e planeje sua{"\n"} próxima viagem!
      </Text>

      <View
        className="w-full bg-zinc-900 p-4 rounded-xl my-8 border border-zinc-800"
      >
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field 
            placeholder="Para onde?"
            editable={stepForm === StepFrom.ADD_EMAIL}
          />
        </Input>

        <Input>
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field 
            placeholder="Quando?" 
            editable={stepForm === StepFrom.ADD_EMAIL}
          />
        </Input>

        {stepForm === StepFrom.TRIP_DETAILS && (
          <View className="py-3 border-b border-zinc-800">
            <Button 
              variant="secondary"
              onPress={() => setStepForm(StepFrom.ADD_EMAIL)}
            >
              <Button.Title>
                Alterar local/data
              </Button.Title>
              <Settings2 color={colors.zinc[200]} size={20} />
            </Button>

            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field placeholder="Quem estará na viagem?" />
            </Input>
          </View>
        )}

        <Button onPress={handleNextStepForm}>
            <Button.Title>
              {stepForm === StepFrom.ADD_EMAIL
                ? "Continuar"
                : "Confirmar email" 
              }
            </Button.Title>
            <ArrowRight color={colors.lime[950]} size={20} />
          </Button>
      </View>

      <Text className="text-zinc-500 font-regular text-center text-base">
        Ao planejar sua viagem pela plann.er você automaticamente concorda com
        nossos{" "}
        <Text className="text-zinc-300 underline">
          termos de uso e políticas de privacidade
        </Text>
      </Text>
    </View>
  )
}