using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEditor;

namespace McpUnity.Resources
{
    public class GetScriptsResource : McpResourceBase
    {
        public GetScriptsResource()
        {
            Name = "get_scripts";
            Description = "Retrieves all C# script files (.cs) in the project with optional filters";
            Uri = "unity://scripts";
        }

        public override JObject Fetch(JObject parameters)
        {
            string searchPattern = parameters?["searchPattern"]?.ToString();
            bool includeContent = parameters?["includeContent"]?.ToObject<bool>() ?? false;
            int maxFileSizeBytes = parameters?["maxFileSizeBytes"]?.ToObject<int>() ?? 50000;

            JArray scripts = GetAllScripts(searchPattern, includeContent, maxFileSizeBytes);

            return new JObject
            {
                ["success"] = true,
                ["message"] = $"Retrieved {scripts.Count} C# script files",
                ["scripts"] = scripts
            };
        }

        private JArray GetAllScripts(string searchPattern, bool includeContent, int maxFileSizeBytes)
        {
            JArray result = new JArray();

            string[] guids = AssetDatabase.FindAssets("t:Script");
            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                if (!path.EndsWith(".cs", StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!string.IsNullOrEmpty(searchPattern) && !path.Contains(searchPattern))
                    continue;

                var fileInfo = new FileInfo(Path.Combine(Application.dataPath, "..", path));

                JObject scriptInfo = new JObject
                {
                    ["name"] = Path.GetFileNameWithoutExtension(path),
                    ["path"] = path,
                    ["size"] = fileInfo.Exists ? fileInfo.Length : -1
                };

                if (includeContent && fileInfo.Exists && fileInfo.Length <= maxFileSizeBytes)
                {
                    string content = File.ReadAllText(fileInfo.FullName);
                    scriptInfo["content"] = content;
                }

                result.Add(scriptInfo);
            }

            return result;
        }
    }
}
