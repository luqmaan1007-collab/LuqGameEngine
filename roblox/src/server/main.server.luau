local Players = game:GetService("Players")

local function onPlayerAdded(player: Player)
    print(("[LuqGameEngine] %s joined"):format(player.Name))
end

Players.PlayerAdded:Connect(onPlayerAdded)
