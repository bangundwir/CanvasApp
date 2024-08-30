import { NextResponse } from 'next/server'
import os from 'os'

export async function GET() {
  const cpus = os.cpus()
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0)
  const totalTick = cpus.reduce((acc, cpu) => acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0), 0)
  const cpuUsage = 100 - (totalIdle / totalTick) * 100

  const cpuModel = cpus[0].model
  const cpuSpeed = cpus[0].speed

  return NextResponse.json({ 
    cpuUsage,
    cpuModel,
    cpuSpeed,
    cores: cpus.length
  })
}